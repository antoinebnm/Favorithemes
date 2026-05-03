// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const STORAGE_KEY = "myFavoriteThemes";

  // Helper to get themes from storage
  const getFavorites = (): string[] => context.globalState.get(STORAGE_KEY, []);

  const treeDataProvider = new ThemeProvider(getFavorites());
  const view = vscode.window.createTreeView("favoriteThemes", {
    treeDataProvider,
  });

  // --- COMMAND: ADD THEME ---
  let addTheme = vscode.commands.registerCommand(
    "favorithemes.addTheme",
    async () => {
      // Fetch all installed themes from all extensions
      const allThemes: string[] = [];
      vscode.extensions.all.forEach((ext) => {
        const themes = ext.packageJSON.contributes?.themes;
        if (themes) {
          themes.forEach((t: any) => allThemes.push(t.label));
        }
      });

      // Show QuickPick menu
      const selected = await vscode.window.showQuickPick(allThemes.sort(), {
        placeHolder: "Select a theme to add to favorites",
      });

      if (selected) {
        const currentFavs = getFavorites();
        if (!currentFavs.includes(selected)) {
          const newFavs = [...currentFavs, selected];
          await context.globalState.update(STORAGE_KEY, newFavs);
          treeDataProvider.refresh(newFavs);
        }
      }
    },
  );

  // --- COMMAND: REMOVE THEME ---
  let removeTheme = vscode.commands.registerCommand(
    "favorithemes.removeTheme",
    async (node: ThemeItem) => {
      const currentFavs = getFavorites();
      const newFavs = currentFavs.filter((t) => t !== node.label);
      await context.globalState.update(STORAGE_KEY, newFavs);
      treeDataProvider.refresh(newFavs);
    },
  );

  // --- COMMAND: APPLY THEME ---
  let applyTheme = vscode.commands.registerCommand(
    "favorithemes.applyTheme",
    (themeName: string) => {
      vscode.workspace
        .getConfiguration()
        .update(
          "workbench.colorTheme",
          themeName,
          vscode.ConfigurationTarget.Global,
        );
    },
  );

  context.subscriptions.push(addTheme, removeTheme, applyTheme);
}

class ThemeProvider implements vscode.TreeDataProvider<ThemeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    ThemeItem | undefined | null | void
  > = new vscode.EventEmitter<ThemeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    ThemeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private themes: string[]) {}

  refresh(themes: string[]): void {
    this.themes = themes;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ThemeItem): vscode.TreeItem {
    return element;
  }
  getChildren(): ThemeItem[] {
    return this.themes.map((t) => new ThemeItem(t));
  }
}

class ThemeItem extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "themeItem"; // Matches "view/item/context" in package.json
    this.command = {
      command: "favorithemes.applyTheme",
      title: "Apply Theme",
      arguments: [this.label],
    };
  }
}
// This method is called when your extension is deactivated
export function deactivate() {}
