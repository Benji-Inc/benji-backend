import ExtendableError from 'extendable-error-class';
import Parse from '../providers/ParseProvider';
import db from '../utils/db';
import ChatService from '../services/ChatService';
import QuePositionsService from '../services/QuePositionsService';

class SetActiveStatusError extends ExtendableError {}

/**
 * Creates the initial channels for the new user
 * @param {*} user
 */
const createUserChannels = async user => {
  // Add to channel members the user
  const members = [user.id];

  // If the desired role exists, add to channel members the admin with that role
  // Get parse role
  const onboardingRole = await new Parse.Query(Parse.Role)
    .equalTo('name', 'ONBOARDING_ADMIN')
    .first();
  if (onboardingRole) {
    // If the role is defined, get the first user with it
    const admin = await onboardingRole.get('users').query().first();
    // If we have users with the desired role, add them to the members
    if (admin) {
      members.push(admin.id);
    }
  }

  // Create the channels
  const welcomeChannel = await ChatService.createChatChannel(
    user,
    `welcome_${user.id}`,
    'welcome',
    'private',
  );
  const welcomeMessage = {
    body: `Hi ${user.get('givenName')} 👋, we are so glad you are here!
    Ours is a better way to communicate online and we want to show a few ways how we do that.
    First is to a set a time each day that you are most ready to READ/RESPOND to messages. We call this a "ritual". Every message anyone sends you will be displayed in your feed during this time. You can always access any message, but the idea here is to help you not be distracted through out your day.
    You may have noticed there isn't a send button! 😱 That's intentional. Simply swipe up on your message in order to send it. If you need to move the cursor, simply hold down on the spacebar. This gesture is to help reduce the number of accidental sends by adding a touch of intentionality 🤗.
    All messages are set to READ manually. This ensures that you know when a message is actually read, not just scrolled too 🧐. Simply tap a message, you want to set, or pull up on the last message in the conversation.
    Hit us up in Feeback if you have issues or suggestions. Enjoy! 🥳`,
    attributes: JSON.stringify({ context: 'status' }),
  };
  // Send the welcome message
  await ChatService.createMessage(welcomeMessage, welcomeChannel.sid);
  await ChatService.addMembersToChannel(welcomeChannel.sid, members);

  const feedbackChannel = await ChatService.createChatChannel(
    user,
    `feedback_${user.id}`,
    'feedback',
    'private',
  );
  const feedbackMessage = {
    body: `Ours is a community of people driven to create a better place to communicate online. That includes you and your feedback! Have a suggestion 🧐? Found a bug 🤭? Let us know here!`,
    attributes: JSON.stringify({ context: 'status' }),
  };
  // Send the feedback message
  await ChatService.createMessage(feedbackMessage, feedbackChannel.sid);
  await ChatService.addMembersToChannel(feedbackChannel.sid, members);
};

/**
 * Creates the handle for the user
 * @param {*} user
 * @param {*} claimedPosition
 */
const getUserHandle = async (user, claimedPosition, maxQuePosition) => {
  // If the user has a quePosition already, use it. Else, get a new quePosition
  const handlePositioN = claimedPosition / maxQuePosition;
  // Generate the user handler
  const name = `${user.get('givenName')}${user
    .get('familyName')
    .substring(0, 1)}`;
  const userHandle = `@${name.toLowerCase()}_${handlePositioN}`;

  return userHandle.replace('.', '');
};

/**
 * Returns the maxQuePosition value
 */
const getMaxQuePosition = async () => {
  const config = await Parse.Config.get({ useMasterKey: true });
  const maxQuePosition = config.get('maxQuePosition');

  return maxQuePosition;
};

/**
 * Sets the user's status from inactive to active
 * @param {*} request
 */
const setActiveStatus = async request => {
  const { user } = request;
  const maxQuePosition = await getMaxQuePosition();
  if (!(user instanceof Parse.User)) {
    throw new SetActiveStatusError('[zIslmc6c] User not found');
  }

  if (user.get('status') === 'inactive') {
    const claimedPosition = await db.getValueForNextSequence('claimedPosition');
    const handle = await getUserHandle(user, claimedPosition, maxQuePosition);
    user.set('handle', handle);
    user.set('status', 'active');
    await user.save(null, { useMasterKey: true });
    await QuePositionsService.update('claimedPosition', claimedPosition);
  }

  const userChannels = await ChatService.getUserChannels(user.id);

  if (!userChannels.length) {
    await createUserChannels(user);
  }

  return user;
};

export default setActiveStatus;
