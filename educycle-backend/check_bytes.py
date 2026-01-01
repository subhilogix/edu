with open(".env", "rb") as f:
    data = f.read(30)
    print(data.hex(" "))
    print(data)
