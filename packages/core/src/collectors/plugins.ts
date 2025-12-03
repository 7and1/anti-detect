export async function collectPlugins(): Promise<string[]> {
  const plugins: string[] = [];

  if (navigator.plugins) {
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      if (plugin && plugin.name) {
        plugins.push(plugin.name);
      }
    }
  }

  return plugins;
}
