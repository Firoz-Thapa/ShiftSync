-- Create a new MySQL user and grant permissions
-- Run as root or an admin user

-- Step 1: Create the user (if not exists)
CREATE USER IF NOT EXISTS 'shiftsync_user'@'%' IDENTIFIED BY 'YourStrongPassword123!';

-- Step 2: Grant all privileges on the shiftsync database to the user
GRANT ALL PRIVILEGES ON shiftsync.* TO 'shiftsync_user'@'%';

-- Step 3: Apply the changes
FLUSH PRIVILEGES;

-- Step 4: Verify the user was created
SELECT user, host FROM mysql.user WHERE user = 'shiftsync_user';