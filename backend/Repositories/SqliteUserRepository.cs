using System.Globalization;
using System.Text.Json;
using backend.Models;
using Microsoft.Data.Sqlite;

namespace backend.Repositories;

public sealed class SqliteUserRepository : IUserRepository
{
    private readonly string _connectionString;

    public SqliteUserRepository(string connectionString)
    {
        _connectionString = connectionString;
        var dataSource = new SqliteConnectionStringBuilder(connectionString).DataSource;
        if (!string.IsNullOrWhiteSpace(dataSource) && dataSource != ":memory:")
        {
            var directory = Path.GetDirectoryName(Path.GetFullPath(dataSource));
            if (directory is not null) Directory.CreateDirectory(directory);
        }

        using var connection = new SqliteConnection(_connectionString);
        connection.Open();
        using var transaction = connection.BeginTransaction();
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL COLLATE NOCASE UNIQUE,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL,
                assigned_workplace_ids TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                invitation_token_hash TEXT,
                invitation_expires_at TEXT
            );
            """;
        command.ExecuteNonQuery();
        EnsureColumn(connection, transaction, "invitation_token_hash", "TEXT");
        EnsureColumn(connection, transaction, "invitation_expires_at", "TEXT");
        transaction.Commit();
    }

    public async Task<List<UserRecord>> GetAllAsync()
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM users ORDER BY id;";
        await using var reader = await command.ExecuteReaderAsync();
        var users = new List<UserRecord>();
        while (await reader.ReadAsync()) users.Add(ReadUser(reader));
        return users;
    }

    public async Task<UserRecord?> GetByIdAsync(int id)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM users WHERE id = $id;";
        command.Parameters.AddWithValue("$id", id);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadUser(reader) : null;
    }

    public async Task<UserRecord?> GetByEmailAsync(string email)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT * FROM users WHERE email = $email;";
        command.Parameters.AddWithValue("$email", email);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadUser(reader) : null;
    }

    public async Task<UserRecord> CreateSelfRegisteredAsync(UserRecord user)
    {
        await using var connection = await OpenConnectionAsync();
        using var transaction = connection.BeginTransaction(deferred: false);

        user.Role = UserRoles.Agent;
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            INSERT INTO users (email, first_name, last_name, role, status, assigned_workplace_ids, created_at, updated_at, password_hash, invitation_token_hash, invitation_expires_at)
            VALUES ($email, $firstName, $lastName, $role, $status, $workplaceIds, $createdAt, $updatedAt, $passwordHash, $invitationTokenHash, $invitationExpiresAt);
            SELECT last_insert_rowid();
            """;
        AddUserParameters(command, user);
        user.Id = Convert.ToInt32(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
        await transaction.CommitAsync();
        return Clone(user);
    }

    public async Task<UserRecord?> CreateBootstrapAdminAsync(UserRecord user)
    {
        await using var connection = await OpenConnectionAsync();
        using var transaction = connection.BeginTransaction(deferred: false);
        await using (var countCommand = connection.CreateCommand())
        {
            countCommand.Transaction = transaction;
            countCommand.CommandText = "SELECT COUNT(*) FROM users;";
            if (Convert.ToInt32(await countCommand.ExecuteScalarAsync(), CultureInfo.InvariantCulture) != 0)
                return null;
        }

        user.Role = UserRoles.Admin;
        await using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = """
            INSERT INTO users (email, first_name, last_name, role, status, assigned_workplace_ids, created_at, updated_at, password_hash, invitation_token_hash, invitation_expires_at)
            VALUES ($email, $firstName, $lastName, $role, $status, $workplaceIds, $createdAt, $updatedAt, $passwordHash, $invitationTokenHash, $invitationExpiresAt);
            SELECT last_insert_rowid();
            """;
        AddUserParameters(command, user);
        user.Id = Convert.ToInt32(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
        await transaction.CommitAsync();
        return Clone(user);
    }

    public async Task<UserRecord> CreateAsync(UserRecord user)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO users (email, first_name, last_name, role, status, assigned_workplace_ids, created_at, updated_at, password_hash, invitation_token_hash, invitation_expires_at)
            VALUES ($email, $firstName, $lastName, $role, $status, $workplaceIds, $createdAt, $updatedAt, $passwordHash, $invitationTokenHash, $invitationExpiresAt);
            SELECT last_insert_rowid();
            """;
        AddUserParameters(command, user);
        user.Id = Convert.ToInt32(await command.ExecuteScalarAsync(), CultureInfo.InvariantCulture);
        return Clone(user);
    }

    public async Task<UserRecord?> UpdateAsync(UserRecord user)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE users
            SET email = $email, first_name = $firstName, last_name = $lastName, role = $role, status = $status,
                assigned_workplace_ids = $workplaceIds, created_at = $createdAt, updated_at = $updatedAt, password_hash = $passwordHash,
                invitation_token_hash = $invitationTokenHash, invitation_expires_at = $invitationExpiresAt
            WHERE id = $id;
            """;
        AddUserParameters(command, user);
        command.Parameters.AddWithValue("$id", user.Id);
        return await command.ExecuteNonQueryAsync() == 0 ? null : Clone(user);
    }

    public async Task<UserRecord?> CompleteInvitationAsync(string tokenHash, string passwordHash, DateTime now)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE users
            SET status = $active, password_hash = $passwordHash, invitation_token_hash = NULL,
                invitation_expires_at = NULL, updated_at = $now
            WHERE status = $invited AND invitation_token_hash = $tokenHash AND invitation_expires_at > $now
            RETURNING *;
            """;
        command.Parameters.AddWithValue("$active", UserStatuses.Active);
        command.Parameters.AddWithValue("$invited", UserStatuses.Invited);
        command.Parameters.AddWithValue("$passwordHash", passwordHash);
        command.Parameters.AddWithValue("$now", now.ToString("O", CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("$tokenHash", tokenHash);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadUser(reader) : null;
    }

    public async Task<UserRecord?> RefreshInvitationAsync(int id, string tokenHash, DateTime expiresAt, DateTime updatedAt)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            UPDATE users
            SET invitation_token_hash = $tokenHash, invitation_expires_at = $expiresAt, updated_at = $updatedAt
            WHERE id = $id AND status = $invited
            RETURNING *;
            """;
        command.Parameters.AddWithValue("$tokenHash", tokenHash);
        command.Parameters.AddWithValue("$expiresAt", expiresAt.ToString("O", CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("$updatedAt", updatedAt.ToString("O", CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$invited", UserStatuses.Invited);
        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? ReadUser(reader) : null;
    }

    public async Task DeleteInvitationAsync(int id, string tokenHash)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = "DELETE FROM users WHERE id = $id AND status = $invited AND invitation_token_hash = $tokenHash;";
        command.Parameters.AddWithValue("$id", id);
        command.Parameters.AddWithValue("$invited", UserStatuses.Invited);
        command.Parameters.AddWithValue("$tokenHash", tokenHash);
        await command.ExecuteNonQueryAsync();
    }

    private async Task<SqliteConnection> OpenConnectionAsync()
    {
        var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        return connection;
    }

    private static void AddUserParameters(SqliteCommand command, UserRecord user)
    {
        command.Parameters.AddWithValue("$email", user.Email);
        command.Parameters.AddWithValue("$firstName", user.FirstName);
        command.Parameters.AddWithValue("$lastName", user.LastName);
        command.Parameters.AddWithValue("$role", user.Role);
        command.Parameters.AddWithValue("$status", user.Status);
        command.Parameters.AddWithValue("$workplaceIds", JsonSerializer.Serialize(user.AssignedWorkplaceIds));
        command.Parameters.AddWithValue("$createdAt", user.CreatedAt.ToString("O", CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("$updatedAt", user.UpdatedAt.ToString("O", CultureInfo.InvariantCulture));
        command.Parameters.AddWithValue("$passwordHash", user.PasswordHash);
        command.Parameters.AddWithValue("$invitationTokenHash", (object?)user.InvitationTokenHash ?? DBNull.Value);
        command.Parameters.AddWithValue("$invitationExpiresAt", user.InvitationExpiresAt is { } expiresAt
            ? expiresAt.ToString("O", CultureInfo.InvariantCulture)
            : DBNull.Value);
    }

    private static UserRecord ReadUser(SqliteDataReader reader) => new()
    {
        Id = reader.GetInt32(reader.GetOrdinal("id")),
        Email = reader.GetString(reader.GetOrdinal("email")),
        FirstName = reader.GetString(reader.GetOrdinal("first_name")),
        LastName = reader.GetString(reader.GetOrdinal("last_name")),
        Role = reader.GetString(reader.GetOrdinal("role")),
        Status = reader.GetString(reader.GetOrdinal("status")),
        AssignedWorkplaceIds = JsonSerializer.Deserialize<List<int>>(reader.GetString(reader.GetOrdinal("assigned_workplace_ids"))) ?? new(),
        CreatedAt = DateTime.Parse(reader.GetString(reader.GetOrdinal("created_at")), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
        UpdatedAt = DateTime.Parse(reader.GetString(reader.GetOrdinal("updated_at")), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind),
        PasswordHash = reader.GetString(reader.GetOrdinal("password_hash")),
        InvitationTokenHash = reader.IsDBNull(reader.GetOrdinal("invitation_token_hash")) ? null : reader.GetString(reader.GetOrdinal("invitation_token_hash")),
        InvitationExpiresAt = reader.IsDBNull(reader.GetOrdinal("invitation_expires_at"))
            ? null
            : DateTime.Parse(reader.GetString(reader.GetOrdinal("invitation_expires_at")), CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind)
    };

    private static UserRecord Clone(UserRecord user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FirstName = user.FirstName,
        LastName = user.LastName,
        Role = user.Role,
        Status = user.Status,
        AssignedWorkplaceIds = user.AssignedWorkplaceIds.ToList(),
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        PasswordHash = user.PasswordHash,
        InvitationTokenHash = user.InvitationTokenHash,
        InvitationExpiresAt = user.InvitationExpiresAt
    };

    private static void EnsureColumn(SqliteConnection connection, SqliteTransaction transaction, string columnName, string columnType)
    {
        using var command = connection.CreateCommand();
        command.Transaction = transaction;
        command.CommandText = "PRAGMA table_info(users);";
        using var reader = command.ExecuteReader();
        while (reader.Read())
        {
            if (reader.GetString(reader.GetOrdinal("name")) == columnName) return;
        }
        reader.Close();

        using var alter = connection.CreateCommand();
        alter.Transaction = transaction;
        alter.CommandText = $"ALTER TABLE users ADD COLUMN {columnName} {columnType};";
        alter.ExecuteNonQuery();
    }
}
