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
        using var command = connection.CreateCommand();
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
                password_hash TEXT NOT NULL
            );
            """;
        command.ExecuteNonQuery();
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

    public async Task<UserRecord> CreateAsync(UserRecord user)
    {
        await using var connection = await OpenConnectionAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
            INSERT INTO users (email, first_name, last_name, role, status, assigned_workplace_ids, created_at, updated_at, password_hash)
            VALUES ($email, $firstName, $lastName, $role, $status, $workplaceIds, $createdAt, $updatedAt, $passwordHash);
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
                assigned_workplace_ids = $workplaceIds, created_at = $createdAt, updated_at = $updatedAt, password_hash = $passwordHash
            WHERE id = $id;
            """;
        AddUserParameters(command, user);
        command.Parameters.AddWithValue("$id", user.Id);
        return await command.ExecuteNonQueryAsync() == 0 ? null : Clone(user);
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
        PasswordHash = reader.GetString(reader.GetOrdinal("password_hash"))
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
        PasswordHash = user.PasswordHash
    };
}
