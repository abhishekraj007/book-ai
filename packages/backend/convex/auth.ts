import { authComponent } from "./lib/betterAuth";

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();
