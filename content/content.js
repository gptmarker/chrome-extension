import altogic from '../src/libs/altogic';

const container = document.querySelector('form > :first-child > :first-child');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="18" width="18"><path fill='currentColor' d="M10 42V8.75q0-1.2.9-2.1.9-.9 2.1-.9h22q1.2 0 2.1.9.9.9.9 2.1V42l-14-6Zm3-4.55 11-4.65 11 4.65V8.75H13Zm0-28.7h22-11Z"/></svg>`;

const btn = `<button id='saveBtnFromExtension' class="btn flex gap-2 justify-center btn-neutral">${svg} Save Thread</button>`;

container?.classList?.add('button-parent-for-extension');
let CSS = `<style id='CSSFromExtension'>`;
CSS += `
#saveBtnFromExtension {
	display: none;
}
.button-parent-for-extension:has(button:not(#saveBtnFromExtension)) #saveBtnFromExtension { 
	display: flex;
}
`;
CSS += `</style>`;

if (!document.querySelector('#CSSFromExtension')) {
	document.head.insertAdjacentHTML('beforeend', CSS);
}

if (!document.querySelector('#saveBtnFromExtension')) {
	container.insertAdjacentHTML('afterbegin', btn);
}

document.querySelector('#saveBtnFromExtension')?.addEventListener('click', saveThread);

async function saveThread() {
	try {
		let html = document.querySelector('main > :first-child').cloneNode(true);

		const cssLink = document.querySelector("link[rel='stylesheet']").href;
		html = fixImageSrc(html);
		const { question, answer } = getFirstQuestionAndAnswer();

		this.disabled = true;
		const { data, errors } = await altogic.db.model('gpt').create({
			html: html.outerHTML,
			cssLink,
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

function getFirstQuestionAndAnswer() {
	const STRING_LENGTH = 140;
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

function fixImageSrc(parent) {
	const DOMAIN = 'https://chat.openai.com';
	parent.querySelectorAll('img').forEach(img => {
		if (img.getAttribute('src').startsWith('/_next')) {
			img.removeAttribute('srcset');
			img.setAttribute('src', `${DOMAIN}${img.getAttribute('src')}`);
		}
	});

	return parent;
}

function hasMaxLengthThresholdExceeded(errors) {
	return errors.items.some(error => error.code === 'max_length_threshold_exceeded');
}
