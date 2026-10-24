import { Component } from 'react';
import './ErrorBoundary.css';

/** Contains render/lifecycle failures without depending on the router or app providers. */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`Rendering failed in ${this.props.area || 'the application'}`, error, info);
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.reset();
    }
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    const { area = 'This screen', variant = 'page' } = this.props;
    const isRoot = variant === 'root';
    return (
      <div
        className={`error-boundary error-boundary--${variant} ${variant === 'page' ? 'page-wrapper' : ''}`}
      >
        <section
          className="error-boundary__card"
          role="alert"
          aria-label={isRoot ? 'Application error' : `${area} error`}
        >
          <span className="error-boundary__icon" aria-hidden="true">
            !
          </span>
          <h1>{isRoot ? 'Something went wrong' : `${area} could not be displayed`}</h1>
          <p>
            {isRoot
              ? 'The application ran into a problem. Try again or reload the page.'
              : 'This area ran into a problem. You can try again or use the menu to open another screen.'}
          </p>
          <div className="error-boundary__actions">
            <button type="button" className="error-boundary__retry" onClick={this.reset}>
              Try again
            </button>
            <a href="/">Go to apps home</a>
            <button
              type="button"
              className="error-boundary__reload"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </section>
      </div>
    );
  }
}
