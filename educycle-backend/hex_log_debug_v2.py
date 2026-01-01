import re

def get_hex(s):
    return ' '.join(format(ord(c), '02x') for c in s)

with open("otp_debug.log", "r") as f:
    for line in f:
        line = line.strip()
        if "VERIFYING" in line:
            otp_match = re.search(r"otp=\[(.*?)\]", line)
            if otp_match:
                otp = otp_match.group(1)
                print(f"INPUT OTP: [{otp}] HEX: {get_hex(otp)}")
        if "FOUND DOC" in line:
            # Look at NEXT line if stored_otp isn't on this one
            content = line
        if "stored_otp=" in line:
            stored_match = re.search(r"stored_otp=\[(.*?)\]", line)
            if stored_match:
                s_otp = stored_match.group(1)
                print(f"STORED OTP: [{s_otp}] HEX: {get_hex(s_otp)}")
        if "SENDING" in line:
            s_otp_match = re.search(r"otp=\[(.*?)\]", line)
            if s_otp_match:
                sent_otp = s_otp_match.group(1)
                print(f"SENT OTP: [{sent_otp}] HEX: {get_hex(sent_otp)}")
