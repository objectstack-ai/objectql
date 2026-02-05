const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  child: () => mockLogger
};

function DummyKernel(...args) {
    const self = this || {};
    self.args = args;
    self.logger = mockLogger;
    self.kernel = {}; 
    self.bootstrap = jest.fn().mockResolvedValue(undefined);
    self.start = jest.fn().mockResolvedValue(undefined);
    self.use = jest.fn();
    self.getEntry = jest.fn().mockReturnValue({});
    
    return self;
}

// Add prototype methods for class inheritance compatibility
DummyKernel.prototype.bootstrap = jest.fn().mockResolvedValue(undefined);
DummyKernel.prototype.start = jest.fn().mockResolvedValue(undefined);
DummyKernel.prototype.use = jest.fn();

const proxy = new Proxy({}, {
  get: function(target, prop) {
    if (prop === '__esModule') {
      return true;
    }
    
    // Explicit exports
    if (prop === 'createLogger') {
      return () => mockLogger;
    }
    
    if (prop === 'ObjectKernel' || prop === 'ObjectStack') {
        return DummyKernel;
    }
    
    // For other exports, return a generic mock or DummyKernel if it looks like a class
    if (typeof prop === 'string' && /^[A-Z]/.test(prop)) {
        return DummyKernel;
    }
    
    return jest.fn();
  }
});

module.exports = proxy;
