with open("otp_debug.log", "r") as f:
    for line in f:
        if "SENDING" in line or "VERIFYING" in line or "FAILED" in line:
            print(f"DEBUG LINE: {line.strip()}")
            # Extract everything inside []
            import re
            matches = re.findall(r"\[(.*?)\]", line)
            for m in matches:
                print(f"HEX for [{m}]: {' '.join(format(ord(c), '02x') for c in m)}")
