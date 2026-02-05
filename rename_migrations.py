
import os
import re
import subprocess

MIGRATION_DIR = 'supabase/migrations'

def run_command(cmd):
    print(f"Running: {cmd}")
    subprocess.run(cmd, shell=True, check=True)

def main():
    files = sorted([f for f in os.listdir(MIGRATION_DIR) if f.endswith('.sql')])
    
    # Filter out .bak or temp files
    files = [f for f in files if not f.endswith('.bak')]

    base_ts = 20240101000000
    
    new_files = []
    old_versions = []
    new_versions = []

    for i, filename in enumerate(files):
        # Extract existing version for reverting
        # Assuming format like 001_name.sql or 0021_name.sql
        match = re.match(r'^(\d+)_', filename)
        if match:
            old_version = match.group(1)
            old_versions.append(old_version)
        
        # Generate new timestamp
        ts = base_ts + (i + 1)
        # Format as string
        new_filename = f"{ts}_{filename.split('_', 1)[1]}"
        
        # Rename
        old_path = os.path.join(MIGRATION_DIR, filename)
        new_path = os.path.join(MIGRATION_DIR, new_filename)
        
        print(f"Renaming {filename} -> {new_filename}")
        os.rename(old_path, new_path)
        
        # Track for applying, but EXCLUDE the last one (020) if it is the fix
        # Wait, I want to apply EVERYTHING that is already in DB.
        # 020 is NOT in DB yet. 019 IS in DB (supposedly).
        # But wait, 019 was 'local only' in my last check?
        # No, 019 was '019 | | 019'.
        # And 020 was '020 | | 020'.
        # Ideally, I want db push to run 019 and 020?
        # Or just 020?
        # If I want it to run 019, I should NOT mark 019 as applied.
        # But if 019 is already "done" functionally?
        # 019 is "fix_onboarding_trigger".
        # I'll check if it's applied. 
        # Actually, to be safe, I will mark applied up to 018.
        # And let db push try 019 and 020.
        # If 019 fails (already exists), then I mark it applied.
        
        # For now, let's look at the filename.
        # If filename contains '020', skip applying.
        # If filename contains '019', skip applying?
        # Let's be conservative. Mark applied up to 018?
        # Or check the list.
        # 018 was '018 | 018 | 018'. So 018 IS applied.
        # 019 was '019 | | 019'. So 019 is NOT applied on remote.
        # So I should mark applied up to 018 (inclusive).
        
        if '020' in filename or '019' in filename:
             pass 
        else:
             new_versions.append(str(ts))

    # Revert OLD versions
    # We revert ALL found old versions to clean up history
    if old_versions:
        cmd = f"npx supabase migration repair --status reverted {' '.join(old_versions)}"
        # run_command(cmd) 
        print(f"TODO: {cmd}")

    # Apply NEW versions
    if new_versions:
        cmd = f"npx supabase migration repair --status applied {' '.join(new_versions)}"
        # run_command(cmd)
        print(f"TODO: {cmd}")

if __name__ == '__main__':
    main()
