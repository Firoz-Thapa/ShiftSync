-- Step 1: Create the login at server level
USE master;
GO

CREATE LOGIN shiftsync_user WITH PASSWORD = 'YourStrongPassword123!';
GO

-- Step 2: Switch to your database
USE ShiftSyncDB;
GO

-- Step 3: Create user in the database for this login
CREATE USER shiftsync_user FOR LOGIN shiftsync_user;
GO

-- Step 4: Grant db_owner role (full permissions on this database)
ALTER ROLE db_owner ADD MEMBER shiftsync_user;
GO

-- Step 5: Verify the user was created
SELECT name, type_desc, create_date
FROM sys.database_principals
WHERE name = 'shiftsync_user';
GO