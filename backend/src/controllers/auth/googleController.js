import User from "../../models/user.model.js";
import { generateToken } from '../../utils/token.js';
import { sendWelcomeEmail } from '../../utils/email.js';



export async function googleCallBack(req, res) {
  try {
    if (!req.user) {
      console.error('googleCallBack: req.user missing');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }

    // Send welcome email only on brand-new Google signup
    if (req.authInfo?.isNewAccount && !req.user.welcomeEmailSentAt) {
      try {
        const result = await sendWelcomeEmail(req.user.email, req.user.fullName);
        if (result?.success) {
          console.log('[WelcomeEmail] sent:', result.messageId);
          req.user.welcomeEmailSentAt = new Date();
          await req.user.save();
        } else {
          console.error('[WelcomeEmail] failed:', result?.error);
        }
      } catch (e) {
        console.error('[WelcomeEmail] exception:', e);
      }
    }

    // Issue auth cookie/JWT
    generateToken(req.user, res);

    const roleToPath = { admin: '/admin', teacher: '/teacher', student: '/students' };
    const targetPath = roleToPath[req.user.role] || '/students';

    // Build redirect URL with flags
    const url = new URL(`${process.env.CLIENT_URL}${targetPath}`);
    url.searchParams.set('source', 'google');
    url.searchParams.set('role', req.user.role);                       // primary flag
    url.searchParams.set('isNew', String(!!req.authInfo?.isNewAccount));
    // optional fallback flag
    url.searchParams.set('notice', req.user.role === 'student' ? 'verify' : 'ok');

    console.log('[GoogleCB] redirect ->', url.toString());
    return res.redirect(url.toString());
  } catch (e) {
    console.error('googleCallBack error:', e);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=server`);
  }
}


export default User;