const fs = require('fs');
const path = require('path');

function getEmailProvider() {
  const provider = process.env.EMAIL_PROVIDER || 'sendgrid';

  if (provider === 'sendgrid') {
    return require('./emailProviders/sendgridProvider');
  } else if (provider === 'nodemailer') {
    return require('./emailProviders/nodemailerProvider');
  } else {
    throw new Error(`Unknown email provider: ${provider}`);
  }
}

function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf-8');
}

function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

async function sendSessionRequest(mentor, learner, session) {
  try {
    const isEnabled = process.env.EMAIL_ENABLED !== 'false';
    if (!isEnabled) {
      console.log('Email disabled: Skipping session request email');
      return { success: true, skipped: true };
    }

    const provider = getEmailProvider();
    const template = loadTemplate('sessionRequest');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const sessionDate = new Date(session.scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = replaceVariables(template, {
      mentorName: mentor.name,
      learnerName: learner.name,
      skillName: session.skillName || 'a skill',
      sessionDate,
      duration: session.durationMins || 60,
      dashboardUrl: `${frontendUrl}/dashboard`
    });

    const result = await provider.sendEmail({
      to: mentor.email,
      subject: `New Session Request from ${learner.name}`,
      html
    });

    if (result.success) {
      console.log(`Session request email sent to ${mentor.email}`);
    } else {
      console.error(`Failed to send session request email: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('Error in sendSessionRequest:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendSessionScheduled(mentor, learner, session) {
  try {
    const isEnabled = process.env.EMAIL_ENABLED !== 'false';
    if (!isEnabled) {
      console.log('Email disabled: Skipping session scheduled email');
      return { success: true, skipped: true };
    }

    const provider = getEmailProvider();
    const template = loadTemplate('sessionScheduled');

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const sessionDate = new Date(session.scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const variables = {
      skillName: session.skillName || 'a skill',
      sessionDate,
      duration: session.durationMins || 60,
      mentorName: mentor.name,
      learnerName: learner.name,
      meetingLink: session.meetingLink || '#',
      dashboardUrl: `${frontendUrl}/session/${session._id}`
    };

    const htmlMentor = replaceVariables(template, { ...variables, userName: mentor.name });
    const htmlLearner = replaceVariables(template, { ...variables, userName: learner.name });

    const resultMentor = await provider.sendEmail({
      to: mentor.email,
      subject: `Session Scheduled: ${session.skillName}`,
      html: htmlMentor
    });

    const resultLearner = await provider.sendEmail({
      to: learner.email,
      subject: `Session Scheduled: ${session.skillName}`,
      html: htmlLearner
    });

    if (resultMentor.success && resultLearner.success) {
      console.log(`Session scheduled emails sent to ${mentor.email} and ${learner.email}`);
    } else {
      console.error('Failed to send one or more session scheduled emails');
    }

    return {
      success: resultMentor.success && resultLearner.success,
      mentor: resultMentor,
      learner: resultLearner
    };
  } catch (error) {
    console.error('Error in sendSessionScheduled:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendSessionReminder(user, session) {
  try {
    const isEnabled = process.env.EMAIL_ENABLED !== 'false';
    if (!isEnabled) {
      console.log('Email disabled: Skipping session reminder email');
      return { success: true, skipped: true };
    }

    const provider = getEmailProvider();
    const template = loadTemplate('sessionReminder');

    const sessionDate = new Date(session.scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = replaceVariables(template, {
      userName: user.name,
      skillName: session.skillName || 'a skill',
      sessionDate,
      duration: session.durationMins || 60,
      meetingLink: session.meetingLink || '#'
    });

    const result = await provider.sendEmail({
      to: user.email,
      subject: `Reminder: Session Starting Soon - ${session.skillName}`,
      html
    });

    if (result.success) {
      console.log(`Session reminder email sent to ${user.email}`);
    } else {
      console.error(`Failed to send session reminder email: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('Error in sendSessionReminder:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendRVVerificationOTP(data) {
  try {
    const isEnabled = process.env.EMAIL_ENABLED !== 'false';

    if (!isEnabled) {
      console.log('Email disabled: Skipping RV verification OTP email');
      return { success: true, skipped: true };
    }

    const provider = getEmailProvider();
    const template = loadTemplate('rvVerificationOTP');

    const html = replaceVariables(template, {
      userName: data.userName || 'User',
      rvEmail: data.rvEmail,
      otp: data.otp,
      expiryMinutes: data.expiryMinutes || '10'
    });

    const result = await provider.sendEmail({
      to: data.rvEmail,
      subject: 'Your RV College Verification OTP - SkillSync',
      html
    });

    if (result.success) {
      console.log(`RV verification OTP email sent to ${data.rvEmail}`);
    } else {
      console.error(`Failed to send RV verification OTP email: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('Error in sendRVVerificationOTP:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendSessionRequest,
  sendSessionScheduled,
  sendSessionReminder,
  sendRVVerificationOTP
};
