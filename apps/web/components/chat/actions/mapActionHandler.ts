import { ActionHandler, ActionContext } from './types';
import { type AiAction } from '../../../lib/api/ai';

export class MapActionHandler implements ActionHandler {
  canHandle(type: string): boolean {
    return type.startsWith('map.');
  }

  handle(action: AiAction, context: ActionContext): void {
    console.log('[MapActionHandler] Handling:', action);

    if (context.mapSection) {
      context.openMapPanel();
      context.mapSection.executeAction(action);
    }
  }
}
