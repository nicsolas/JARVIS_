export class JarvisError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, code = 'JARVIS_ERROR', details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class RoutingError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'ROUTING_ERROR', details);
  }
}

export class ApprovalRequiredError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'APPROVAL_REQUIRED_ERROR', details);
  }
}

export class ToolExecutionError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'TOOL_EXECUTION_ERROR', details);
  }
}

export class ProviderError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'PROVIDER_ERROR', details);
  }
}

export class TimeoutError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIMEOUT_ERROR', details);
  }
}

export class CancelledError extends JarvisError {
  constructor(message: string, details?: unknown) {
    super(message, 'CANCELLED_ERROR', details);
  }
}
