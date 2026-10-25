(function () {
  // FormBuilder Embeddable Chatbot Widget Loader
  try {
    const currentScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    const formId = currentScript ? currentScript.getAttribute('data-form-id') : 'feedback-survey';
    const primaryColor = (currentScript && currentScript.getAttribute('data-primary-color')) || '#2563eb';

    // Widget container
    const container = document.createElement('div');
    container.id = 'formbuilder-widget-root';
    container.style.position = 'fixed';
    container.style.bottom = '24px';
    container.style.right = '24px';
    container.style.zIndex = '999999';
    container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Launcher button
    const btn = document.createElement('button');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg> <span style="margin-left:8px;font-weight:600;font-size:13px;">Chat with Us</span>`;
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.backgroundColor = primaryColor;
    btn.style.color = '#ffffff';
    btn.style.border = 'none';
    btn.style.borderRadius = '50px';
    btn.style.padding = '12px 20px';
    btn.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.2)';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'transform 0.2s ease';

    btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

    // Iframe modal
    const frame = document.createElement('iframe');
    const origin = currentScript && currentScript.src ? new URL(currentScript.src).origin : window.location.origin;
    frame.src = `${origin}/forms/${formId}`;
    frame.style.display = 'none';
    frame.style.width = '380px';
    frame.style.height = '580px';
    frame.style.border = '1px solid #e2e8f0';
    frame.style.borderRadius = '16px';
    frame.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
    frame.style.marginBottom = '12px';

    let isOpen = false;
    btn.onclick = () => {
      isOpen = !isOpen;
      frame.style.display = isOpen ? 'block' : 'none';
    };

    container.appendChild(frame);
    container.appendChild(btn);
    document.body.appendChild(container);
  } catch (err) {
    console.error('Failed to initialize FormBuilder widget:', err);
  }
})();
