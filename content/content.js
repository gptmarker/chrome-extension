import altogic from '../src/libs/altogic';

const container = document.querySelector('form > :first-child > :first-child');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="18" width="18"><path fill='currentColor' d="M10 42V8.75q0-1.2.9-2.1.9-.9 2.1-.9h22q1.2 0 2.1.9.9.9.9 2.1V42l-14-6Zm3-4.55 11-4.65 11 4.65V8.75H13Zm0-28.7h22-11Z"/></svg>`;

const btn = `<button id='saveThreadButtonFromGPTMarker' class="btn flex gap-2 justify-center btn-neutral">${svg} Save Thread</button>`;

if (!document.querySelector('#saveBtnFromExtension')) {
	container.insertAdjacentHTML('afterbegin', btn);
}

document.querySelector('#saveThreadButtonFromGPTMarker')?.addEventListener('click', saveThread);

async function saveThread() {
	const SUBMIT_BUTTON = document.querySelector('form textarea + button');
	const CONTAINER_SELECTOR =
		'[class*="react-scroll-to-bottom"] > [class*="react-scroll-to-bottom"] > :first-child > *';
	const conversationThread = document.querySelectorAll(CONTAINER_SELECTOR);
	const threads = [];

	if (SUBMIT_BUTTON.disabled) {
		return alert('Please wait for the answer');
	}

	try {
		this.disabled = true;
		const { question, answer } = getFirstQuestionAndAnswer();

		for (const child of conversationThread) {
			const markdownContainer = child.querySelector('.markdown');
			if (child.classList.contains('dark:bg-gray-800')) {
				threads.push({ from: 'human', content: child.textContent });
			} else if (child.classList.contains('bg-gray-50')) {
				threads.push({ from: 'gpt', content: markdownContainer.outerHTML });
			}
		}

		const { data, errors } = await altogic.db.model('gpt').create({
			threads,
			userImage: getUserImage(),
			question,
			answer,
		});

		if (!errors) return open(`https://www.gptmarker.com/${data.shareId}`, '_blank');
		if (hasMaxLengthThresholdExceeded(errors)) alert('The thread is too long, please shorten it and try again');
		else alert("Couldn't save thread, please try again.");
	} catch (error) {
		alert(error.message);
	} finally {
		this.disabled = false;
	}
}

function hasMaxLengthThresholdExceeded(errors) {
	return errors.items.some(error => error.code === 'max_length_threshold_exceeded');
}

function getUserImage() {
	const canvas = document.createElement('canvas');
	const image = document.querySelectorAll('img')[1];

	canvas.width = 30;
	canvas.height = 30;

	canvas.getContext('2d').drawImage(image, 0, 0);

	return canvas.toDataURL('image/jpeg');
}

function getFirstQuestionAndAnswer() {
	const STRING_LENGTH = 160;
	// This selector may change in the future
	const selector =
		'[class*="react-scroll-to-bottom"] > [class*="react-scroll-to-bottom"] > :first-child > *:not(:last-child)';
	const thread = document.querySelectorAll(selector);

	if (thread.length < 2) {
		throw new Error('Please ask a question and wait for an answer before saving the thread');
	}

	const answer = thread[1].cloneNode(true);
	answer.querySelector('pre')?.remove();

	let answerText = answer.textContent.trim();
	let questionText = thread[0].textContent.trim();

	if (answerText.length > STRING_LENGTH) {
		answerText = answerText.slice(0, STRING_LENGTH) + '...';
	}

	if (questionText.length > STRING_LENGTH) {
		questionText = questionText.slice(0, STRING_LENGTH) + '...';
	}

	return {
		question: questionText,
		answer: answerText,
	};
}
