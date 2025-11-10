-- Reset the password for the existing user
ALTER LOGIN shiftsync_user WITH PASSWORD = 'ShiftSync@2024!';

-- Make sure the user exists in the database and has permissions
USE ShiftSyncDB;

-- Grant permissions (in case they weren't set)
ALTER ROLE db_owner ADD MEMBER shiftsync_user;