import re

EMAIL_RE = re.compile(r'^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
PHONE_RE = re.compile(r'^\d{10}$')
USERNAME_RE = re.compile(r'^[a-zA-Z0-9_.]{4,30}$')


def validate_member_fields(name, email, phone, username=None, password=None, require_login=False):
    if not name or len(name.strip()) < 2:
        return "Name must be at least 2 characters."

    if not email or not EMAIL_RE.match(email.strip()):
        return "Enter a valid email address (e.g. name@example.com)."

    if phone:
        if not PHONE_RE.match(phone.strip()):
            return "Phone number must be exactly 10 digits."

    if require_login or username or password:
        if not username or not USERNAME_RE.match(username.strip()):
            return "Username must be 4-30 characters (letters, numbers, '.', '_' only)."
        if not password or len(password) < 8:
            return "Password must be at least 8 characters long."
        if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
            return "Password must contain at least one letter and one number."

    return None


def validate_profile_fields(name, phone):
    if not name or len(name.strip()) < 2:
        return "Name must be at least 2 characters."
    if phone and not PHONE_RE.match(phone.strip()):
        return "Phone number must be exactly 10 digits."
    return None