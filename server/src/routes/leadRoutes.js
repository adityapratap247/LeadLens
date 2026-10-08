import express from 'express';
import multer from 'multer';
import {
  getLeads,
  loadSampleData,
  uploadCsv,
  pasteDomains,
  voteLead,
  exportCsv,
  clearLeads,
} from '../controllers/leadController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

router.get('/', getLeads);
router.post('/sample', loadSampleData);
router.post('/upload-csv', upload.single('file'), uploadCsv);
router.post('/paste-domains', pasteDomains);
router.post('/:id/vote', voteLead);
router.get('/export-csv', exportCsv);
router.delete('/clear', clearLeads);

export default router;

