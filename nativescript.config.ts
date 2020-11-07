import { NativeScriptConfig } from '@nativescript/core'

export default {
  id: 'tk.ozymandias.hedwigg',
  main: 'main.tns.js',
  appResourcesPath: undefined,
  appPath: 'src',
  webpackConfigPath: 'webpack.config.js',
  shared: true,
  ios: {
    discardUncaughtJsExceptions: true,
  },
  android: {
    discardUncaughtJsExceptions: true,
    v8Flags: '--nolazy --expose_gc',
    markingMode: 'none',
    suppressCallJSMethodExceptions: false,
  },
} as NativeScriptConfig
