class FiveMindsException(Exception):
    def __init__(self, detail: str, status_code: int = 400, error_code: str = "GENERIC_ERROR"):
        self.detail = detail
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(detail)

class ValidationError(FiveMindsException):
    def __init__(self, detail: str):
        super().__init__(detail, 422, "VALIDATION_ERROR")

class PipelineError(FiveMindsException):
    def __init__(self, detail: str):
        super().__init__(detail, 500, "PIPELINE_ERROR")
