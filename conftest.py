def pytest_addoption(parser):
    parser.addoption(
        "--data-files", action="store", help="directory with data files")
