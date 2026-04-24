import uvicorn


def main() -> None:
    uvicorn.run("app.main:app", host="[IP_ADDRESS]", port=8000, reload=True)


if __name__ == "__main__":
    main()
