import { ActionHandler, ActionContext } from './types';
import { type AiAction } from '../../../lib/api/ai';

export class UiActionHandler implements ActionHandler {
  canHandle(type: string): boolean {
    return type.startsWith('ui.');
  }

  handle(action: AiAction, context: ActionContext): void {
    console.log('[UiActionHandler] Handling:', action);

    if (action.type === 'ui.open_panel') {
      context.openMapPanel();

      if (context.mapSection) {
        context.mapSection.executeAction(action);
      }
    }
  }
}
