import Thesis from '../models/project.model.js';
import User from '../models/user.model.js';
import {
  sendThesisApprovedEmail,
  sendThesisRejectedEmail,
  sendThesisEditedEmail,
} from '../utils/email.js';

async function getSubmitterEmail(thesis) {
  if (thesis.submitterEmail) return thesis.submitterEmail;
  if (thesis.owner || thesis.userId) {
    const uid = thesis.owner || thesis.userId;
    const user = await User.findById(uid).lean();
    return user?.email || null;
  }
  return thesis.contactEmail || null;
}

// PATCH /api/admin/thesis/:id/status
export async function setThesisStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const thesis = await Thesis.findById(id);
    if (!thesis) return res.status(404).json({ message: 'Not found' });

    thesis.status = status;
    await thesis.save();

    const to = await getSubmitterEmail(thesis);
    let emailStatus = { sent: false, reason: 'skipped' };

    if (!to) {
      console.warn('[MAIL][SKIP] No recipient email for thesis:', thesis._id, thesis.title);
      emailStatus = { sent: false, reason: 'no-recipient' };
    } else {
      try {
        if (status === 'approved') {
          const r = await sendThesisApprovedEmail({
            to, title: thesis.title, year: thesis.year, category: thesis.category
          });
          emailStatus = { sent: !!r.success, messageId: r.messageId || null, error: r.error || null };
        } else if (status === 'rejected') {
          const r = await sendThesisRejectedEmail({
            to, title: thesis.title, year: thesis.year, category: thesis.category, reason
          });
          emailStatus = { sent: !!r.success, messageId: r.messageId || null, error: r.error || null };
        }
        console.log(`[MAIL][${status.toUpperCase()}] to=${to} title="${thesis.title}" ->`, emailStatus);
      } catch (mailErr) {
        console.error('[MAIL][ERROR]', mailErr);
        emailStatus = { sent: false, error: mailErr.message || String(mailErr) };
      }
    }

    return res.json({ ok: true, thesis, emailStatus });
  } catch (e) {
    console.error('setThesisStatus error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}

// PATCH /api/admin/thesis/:id  (called by EditThesisModal)
export async function editThesis(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const thesis = await Thesis.findById(id);
    if (!thesis) return res.status(404).json({ message: 'Not found' });

    const before = thesis.toObject();
    Object.assign(thesis, updates);
    await thesis.save();
    const after = thesis.toObject();

    const keys = ['title', 'year', 'category', 'abstract', 'keywords', 'authors'];
    const changes = {};
    for (const k of keys) {
      if (JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null)) {
        changes[k] = { from: before[k], to: after[k] };
      }
    }

    let emailStatus = { sent: false, reason: 'no-changes' };
    const to = await getSubmitterEmail(thesis);

    if (Object.keys(changes).length && to) {
      try {
        const r = await sendThesisEditedEmail({ to, title: thesis.title, changes });
        emailStatus = { sent: !!r.success, messageId: r.messageId || null, error: r.error || null };
        console.log('[MAIL][EDIT] to=%s title="%s" ->', to, thesis.title, emailStatus);
      } catch (mailErr) {
        console.error('[MAIL][EDIT][ERROR]', mailErr);
        emailStatus = { sent: false, error: mailErr.message || String(mailErr) };
      }
    } else if (!to) {
      console.warn('[MAIL][EDIT][SKIP] No recipient email for thesis:', thesis._id, thesis.title);
      emailStatus = { sent: false, reason: 'no-recipient' };
    }

    return res.json({ ok: true, thesis, emailStatus, changes });
  } catch (e) {
    console.error('editThesis error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
}
