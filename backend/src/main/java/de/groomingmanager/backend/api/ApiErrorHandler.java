package de.groomingmanager.backend.api;

import java.net.URI;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiErrorHandler {

  private static final URI VALIDATION_ERROR_TYPE =
      URI.create("https://grooming-manager.local/problems/validation-error");
  private static final URI INTERNAL_ERROR_TYPE =
      URI.create("https://grooming-manager.local/problems/internal-server-error");
  private static final URI FORBIDDEN_TYPE =
      URI.create("https://grooming-manager.local/problems/forbidden");

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ProblemDetail> handleValidationError(MethodArgumentNotValidException exception) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problem.setType(VALIDATION_ERROR_TYPE);
    problem.setTitle("Validation failed");
    problem.setDetail("The request contains invalid fields.");
    problem.setProperty("errors", fieldErrors(exception));

    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler({
    MissingServletRequestParameterException.class,
    MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<ProblemDetail> handleRequestParameterError(Exception exception) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
    problem.setType(VALIDATION_ERROR_TYPE);
    problem.setTitle("Validation failed");
    problem.setDetail("The request contains invalid parameters.");

    return ResponseEntity.badRequest().body(problem);
  }

  @ExceptionHandler(AuthorizationDeniedException.class)
  ResponseEntity<ProblemDetail> handleAuthorizationDenied(AuthorizationDeniedException exception) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
    problem.setType(FORBIDDEN_TYPE);
    problem.setTitle("Forbidden");
    problem.setDetail("You do not have permission to access this resource.");

    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
  }

  @ExceptionHandler(ResponseStatusException.class)
  ResponseEntity<ProblemDetail> handleResponseStatus(ResponseStatusException exception) {
    ProblemDetail problem = ProblemDetail.forStatus(exception.getStatusCode());
    problem.setTitle(exception.getStatusCode().toString());
    if (exception.getReason() != null && !exception.getReason().isBlank()) {
      problem.setDetail(exception.getReason());
    }

    return ResponseEntity.status(exception.getStatusCode()).body(problem);
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ProblemDetail> handleUnexpectedError(Exception exception) {
    ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    problem.setType(INTERNAL_ERROR_TYPE);
    problem.setTitle("Internal server error");
    problem.setDetail("An unexpected error occurred.");

    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
  }

  private Map<String, String> fieldErrors(MethodArgumentNotValidException exception) {
    return exception.getBindingResult().getFieldErrors().stream()
        .collect(
            Collectors.toMap(
                fieldError -> fieldError.getField(),
                fieldError ->
                    fieldError.getDefaultMessage() == null
                        ? "Invalid value"
                        : fieldError.getDefaultMessage(),
                (first, ignored) -> first));
  }
}
