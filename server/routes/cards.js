const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');

router.get('/:id', cardController.getCardDetails);
router.post('/', cardController.createCard);
router.patch('/move', cardController.moveCards);
router.patch('/:id', cardController.updateCard);
router.delete('/:id', cardController.deleteCard);

// Checklists
router.post('/:id/checklists', cardController.addChecklist);
router.patch('/:id/checklists/:checklistId', cardController.updateChecklist);
router.delete('/:id/checklists/:checklistId', cardController.deleteChecklist);
router.post('/:id/checklists/:checklistId/items', cardController.addChecklistItem);
router.patch('/:id/checklist-items/:itemId', cardController.updateChecklistItem);
router.delete('/checklist-items/:itemId', cardController.deleteChecklistItem);
router.delete('/:id/checklist-items/:itemId', cardController.deleteChecklistItem);

// Labels & Members
router.post('/:id/labels', cardController.addLabel);
router.delete('/:id/labels/:labelId', cardController.removeLabel);
router.post('/:id/members', cardController.addMember);
router.delete('/:id/members/:userId', cardController.removeMember);

module.exports = router;