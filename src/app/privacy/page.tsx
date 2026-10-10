export const metadata = { title: "Privacy · whoamifetch" };

export default function Privacy() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6 text-sm leading-6">
      <h1 className="text-2xl font-semibold">Privacy</h1>
      <p>whoamifetch runs entirely in your browser. There is no server, no account and no analytics.</p>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Your photo never leaves your device.</strong> An uploaded file is decoded on a canvas in this tab and processed locally. The page cannot upload it anywhere: the site&apos;s Content-Security-Policy only allows connections to this site, <code>api.github.com</code> and <code>avatars.githubusercontent.com</code>.</li>
        <li><strong>GitHub prefill</strong> calls the public GitHub API from your browser for the username you type, and loads that account&apos;s public avatar. Nothing is stored.</li>
        <li><strong>Background removal</strong> uses a MediaPipe model served from this site and executed locally via WebAssembly.</li>
        <li><strong>Verify it:</strong> open your browser&apos;s developer tools, network tab, and watch. A few seconds after the page opens it loads the background-removal model from this site; after that, uploading a photo and generating the card produce no requests at all. You can disable the network at that point and the app keeps working.</li>
      </ul>
      <p>The generated SVG is your file; it contains only what you typed and the portrait you chose.</p>
    </main>
  );
}
