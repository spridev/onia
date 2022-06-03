# @onia/test

## 0.4.0

### Minor Changes

- 9310f53: Rename `config` method to `populate` in the `SystemStore` class.

## 0.3.4

### Patch Changes

- dee215d: Improve `LambdaWrapper` class typings.

## 0.3.3

### Patch Changes

- 73f5ce2: Bump `@hapi/hoek` to `v10.0.0`.

## 0.3.2

### Patch Changes

- 866fc66: Export `DeepPartial` type.

## 0.3.1

### Patch Changes

- 1d27565: Rename `GatewayWrapper` class to `LambdaWrapper`.

## 0.3.0

### Minor Changes

- 7c0099e: Rename `Wrapper` class to `GatewayWrapper`.

### Patch Changes

- 4826cf6: Create a `CognitoClient` class to make the creation and deletion of users easier.
- d20ad9c: Create a `SystemStore` class to populate environment variables from SSM parameters.

## 0.2.1

### Patch Changes

- 39a80d6: Allow overriding any event or context value using `undefined` when calling a handler.

## 0.2.0

### Minor Changes

- 82a9afb: Create a single `Wrapper` class to wrap both promise and callback handlers.

## 0.1.0

### Minor Changes

- df3fce1: Initial release.
