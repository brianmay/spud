import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--data-files", action="store", help="directory with data files")


@pytest.fixture
def data_files(request):
    path = request.config.getoption("--data-files")
    if path is None:
        pytest.skip("--data-files not specified")
    return path
