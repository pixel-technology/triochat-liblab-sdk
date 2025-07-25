type Request = any; // e.g., from 'node-fetch' or your HTTP lib
type Response = any; // e.g., from 'node-fetch' or your HTTP lib
type Exception = Error; // Or your custom error type

/**
 * Represents the full context of an API request, including state.
 * Generic T is the expected response data type.
 */
export interface RequestContext<T = any> {
  request: Request; // The original request object
  response?: Response; // The response (if available)
  error?: Exception; // The error (if any)
  data?: T; // Parsed response data (if successful)
  isLoading: boolean; // Whether a request is in progress
}

/**
 * The Hook interface: methods called during API lifecycle.
 */
export interface Hook<T = any> {
  beforeRequest(context: RequestContext<T>): Promise<void>;
  afterResponse(context: RequestContext<T>): Promise<void>;
  onError(context: RequestContext<T>): Promise<void>;
  getState(): RequestContext<T>;
}

/**
 * Default, stateful hook implementation.
 * Users can extend this class if needed.
 */
export class StatefulHook<T = any> implements Hook<T> {
  protected state: RequestContext<T>;

  constructor() {
    this.state = {
      request: null as any,
      isLoading: false,
      error: undefined,
      response: undefined,
      data: undefined,
    };
  }

  /**
   * Called before the request is sent.
   * Updates state to reflect the request starting.
   */
  async beforeRequest(context: RequestContext<T>): Promise<void> {
    this.state = {
      ...context,
      isLoading: true,
      error: undefined,
      response: undefined,
      data: undefined,
    };
  }

  /**
   * Called after receiving a successful response.
   * Attempts to parse JSON data from the response.
   */
  async afterResponse(context: RequestContext<T>): Promise<void> {
    try {
      const data = context.response?.json ? await context.response.json() : undefined;
      this.state = {
        ...context,
        isLoading: false,
        data,
        error: undefined,
      };
    } catch (e) {
      this.state = {
        ...context,
        isLoading: false,
        error: e as Exception,
      };
      throw e;
    }
  }

  /**
   * Called when an error occurs during the request.
   */
  async onError(context: RequestContext<T>): Promise<void> {
    this.state = {
      ...context,
      isLoading: false,
      error: context.error,
    };
    console.error('Request error:', context.error);
  }

  /**
   * Returns the current state of the request (for users to access).
   */
  getState(): RequestContext<T> {
    return { ...this.state };
  }
}
