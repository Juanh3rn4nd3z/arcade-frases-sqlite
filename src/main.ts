import './styles/styles.css';
import { FraseView } from './views/FraseView';
import { FraseController } from './controllers/FraseController';

document.addEventListener('DOMContentLoaded', async () => {
  const view = new FraseView();
  const controller = new FraseController(view);
  await controller.iniciar();
});