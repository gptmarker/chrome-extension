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
	const html = document.querySelector('main > :first-child').cloneNode(true);

	const cssLink = document.querySelector("link[rel='stylesheet']").href;
	html.querySelectorAll('img').forEach(img => {
		if (img.getAttribute('src').startsWith('/_next')) {
			img.removeAttribute('srcset');
			img.setAttribute('src', `https://chat.openai.com${img.getAttribute('src')}`);
		}
	});

	this.disabled = true;
	const { data, errors } = await altogic.db.model('gpt').create({
		html: html.outerHTML,
		cssLink,
	});

	this.disabled = false;

	if (!errors) return open(`https://www.gptmarker.com/${data.shareId}`, '_blank');
	if (hasMaxLengthThresholdExceeded(errors)) alert('The thread is too long, please shorten it and try again');
	else alert("Couldn't save thread, please try again.");
}

function hasMaxLengthThresholdExceeded(errors) {
	return errors.items.some(error => error.code === 'max_length_threshold_exceeded');
}
