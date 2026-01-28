
import { ObjectKernel } from '@objectstack/core';

async function testKernel() {
    const installFn = jest.fn();
    const initFn = jest.fn();
    const startFn = jest.fn();

    const mockPlugin = {
        name: 'test-plugin',
        install: installFn,
        init: initFn,
        start: startFn,
        onStart: startFn
    };

    console.log('Creating kernel with plugin...');
    const kernel = new (ObjectKernel as any)([mockPlugin]);

    console.log('Bootstrapping kernel...');
    if (kernel.bootstrap) {
        await kernel.bootstrap();
    } else if (kernel.start) {
        await kernel.start();
    }

    console.log('Install Called:', installFn.mock.calls.length);
    console.log('Init Called:', initFn.mock.calls.length);
    console.log('Start Called:', startFn.mock.calls.length);
}

// Mock Jest for standalone run
global.jest = {
    fn: () => {
        const fn = () => {};
        fn.mock = { calls: [] };
        return fn;
    }
} as any;

testKernel().catch(console.error);
