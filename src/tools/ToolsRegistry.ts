/**
 * Tools Registry
 * كل أداة منفصلة عن النموذج – النموذج يطلب، الأداة تنفذ
 */

import { SearchTool } from './search/SearchTool';
import { CalculatorTool } from './calculator/CalculatorTool';
import { FileTool } from './files/FileTool';

export type ToolName = 'search' | 'calculator' | 'files' | 'browser' | 'images';

export class ToolsRegistry {
  private search = new SearchTool();
  private calculator = new CalculatorTool();
  private files = new FileTool();

  listAvailable(): { name: ToolName; description: string; requiresInternet: boolean }[] {
    return [
      { name: 'search', description: 'Web search for live data', requiresInternet: true },
      { name: 'calculator', description: 'Local mathematical calculations', requiresInternet: false },
      { name: 'files', description: 'Read local files (with permission)', requiresInternet: false },
      { name: 'browser', description: 'Fetch web page content', requiresInternet: true },
      { name: 'images', description: 'Image analysis / generation tools', requiresInternet: true },
    ];
  }

  async execute(toolName: ToolName, args: Record<string, unknown>): Promise<{ success: boolean; result?: unknown; error?: string }> {
    switch (toolName) {
      case 'search':
        return this.search.execute(String(args.query || ''));
      case 'calculator':
        return this.calculator.execute(String(args.expression || ''));
      case 'files':
        if (args.action === 'read') {
          return this.files.readTextFile(String(args.path || ''));
        }
        return { success: false, error: 'Unknown file action' };
      case 'browser':
      case 'images':
        return {
          success: false,
          error: `${toolName} tool requires internet and is not fully implemented in this foundation. No fake results will be returned.`,
        };
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }
}
