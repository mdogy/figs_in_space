/** @type {import('ts-jest').JestConfigWithTsJest}
 */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@scenes/(.*)$': '<rootDir>/src/scenes/$1',
    '^@prefabs/(.*)$': '<rootDir>/src/prefabs/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^phaser3spectorjs$': '<rootDir>/tests/mocks/phaser3spectorjs.ts',
    '^phaser$': '<rootDir>/tests/mocks/phaserModule.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      useESM: true,
    }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
