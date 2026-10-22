document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // -------------------- Elements --------------------

const pages = [
  "welcomePage",
  "emailPage",
  "passwordPage",
  "thankYouPage"
];

  const sliderTrack = $("sliderTrack");
  const sliderHandle = $("sliderHandle");
  const sliderHint = $("sliderHint");

  const emailForm = $("emailForm");
  const loginForm = $("loginForm");

  const emailInput = $("emailInput");
  const loginPassword = $("loginPassword");

  const selectedEmail = $("selectedEmail");
  const passwordTitle = $("passwordTitle");

  const welcomeMessage = $("welcomeMessage");
  const emailMessage = $("emailMessage");
  const loginMessage = $("loginMessage");

  const messages = [welcomeMessage, emailMessage, loginMessage];

  let currentEmail = "";
  let sliderCompleted = false;
  let isDragging = false;
  let dragStartX = 0;
  let startLeft = 0;

  // The frontend and API should use the same origin.
  // Open WorkHub through your Express server, not VS Code Live Server.
  const API_BASE = "http://localhost:5000";

  // -------------------- Messages --------------------

  function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.classList.toggle("error", type === "error");
    element.classList.toggle("success", type === "success");
  }

  function clearMessages() {
    messages.forEach((element) => showMessage(element, ""));
  }

  // -------------------- Page navigation --------------------

  function showPage(pageId) {
    pages.forEach((id) => {
      const page = $(id);
      if (page) {
        page.classList.toggle("hidden", id !== pageId);
      }
    });

    clearMessages();

    if (pageId === "emailPage") {
      setTimeout(() => emailInput?.focus(), 0);
    }

    if (pageId === "passwordPage") {
      setTimeout(() => loginPassword?.focus(), 0);
    }
  }

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // -------------------- API request helper --------------------

  async function postJSON(path, payload) {
    let response;

    try {
  response = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
    
  });
    } catch {
      throw new Error(
    
      );
    }

    let data = {};

    try {
      data = await response.json();
    } catch {
    }

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed (${response.status}).`
      );
    }

    return data;
  }

  function setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Signing in…";
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
    } else {
      button.textContent =
        button.dataset.originalText || "Sign in";
      button.disabled = false;
      button.removeAttribute("aria-busy");
      delete button.dataset.originalText;
    }
  }

  // -------------------- Slider --------------------

  function getSliderMaxLeft() {
    if (!sliderTrack || !sliderHandle) return 0;

    return Math.max(
      0,
      sliderTrack.clientWidth - sliderHandle.offsetWidth
    );
  }

  function moveSlider(left) {
    if (!sliderHandle) return;

    const maxLeft = getSliderMaxLeft();
    const safeLeft = Math.max(0, Math.min(left, maxLeft));

    sliderHandle.style.left = `${safeLeft}px`;

    if (sliderHint) {
      sliderHint.style.opacity =
        safeLeft > maxLeft * 0.25 ? "0" : "1";
    }
  }

  function resetSlider() {
    sliderCompleted = false;
    isDragging = false;

    if (sliderHandle) {
      sliderHandle.disabled = false;
      sliderHandle.style.position = "absolute";
      sliderHandle.style.left = "0px";
      sliderHandle.style.touchAction = "none";
      sliderHandle.style.cursor = "grab";
      sliderHandle.setAttribute(
        "aria-label",
        "Drag right to continue"
      );
    }

    if (sliderHint) {
      sliderHint.textContent = "Slide to continue";
      sliderHint.style.opacity = "1";
    }
  }

  function completeSlider() {
    if (sliderCompleted) return;

    sliderCompleted = true;
    isDragging = false;

    if (sliderHint) {
      sliderHint.textContent = "Welcome to WorkHub!";
      sliderHint.style.opacity = "1";
    }

    if (sliderHandle) {
      sliderHandle.style.left = `${getSliderMaxLeft()}px`;
      sliderHandle.setAttribute(
        "aria-label",
        "Slider completed"
      );
    }

    showMessage(welcomeMessage, "", "success");

    setTimeout(() => showPage("emailPage"), 250);
  }

  function beginDrag(event) {
    if (sliderCompleted || !sliderHandle || !sliderTrack) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    isDragging = true;
    dragStartX = event.clientX;

    const currentLeft = parseFloat(sliderHandle.style.left);
    startLeft = Number.isFinite(currentLeft) ? currentLeft : 0;

    try {
      sliderHandle.setPointerCapture(event.pointerId);
    } catch {
      // Continue if pointer capture is unavailable.
    }

    event.preventDefault();
  }

  function continueDrag(event) {
    if (!isDragging || sliderCompleted) return;

    const maxLeft = getSliderMaxLeft();
    const distance = event.clientX - dragStartX;
    const nextLeft = Math.max(
      0,
      Math.min(startLeft + distance, maxLeft)
    );

    moveSlider(nextLeft);

    if (maxLeft > 0 && nextLeft >= maxLeft * 0.85) {
      moveSlider(maxLeft);
      completeSlider();
    }
  }

  function endDrag() {
    if (!isDragging) return;

    isDragging = false;

    const maxLeft = getSliderMaxLeft();
    const currentLeft = parseFloat(sliderHandle.style.left) || 0;

    if (!sliderCompleted && currentLeft < maxLeft * 0.85) {
      moveSlider(0);
    }
  }

  if (sliderHandle) {
    sliderHandle.addEventListener("pointerdown", (event) => {
      sliderHandle.style.cursor = "grabbing";
      beginDrag(event);
    });

    sliderHandle.addEventListener("pointermove", continueDrag);

    sliderHandle.addEventListener("pointerup", () => {
      endDrag();
      sliderHandle.style.cursor = "grab";
    });

    sliderHandle.addEventListener("pointercancel", () => {
      endDrag();
      sliderHandle.style.cursor = "grab";
    });

    sliderHandle.addEventListener("lostpointercapture", endDrag);

    sliderHandle.addEventListener("keydown", (event) => {
      if (sliderCompleted) return;

      const maxLeft = getSliderMaxLeft();
      const currentLeft = parseFloat(sliderHandle.style.left) || 0;

      if (event.key === "ArrowRight") {
        event.preventDefault();

        const nextLeft = Math.min(currentLeft + 20, maxLeft);
        moveSlider(nextLeft);

        if (maxLeft > 0 && nextLeft >= maxLeft * 0.85) {
          completeSlider();
        }
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSlider(Math.max(currentLeft - 20, 0));
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        completeSlider();
      }
    });
  }

  $("continueWithoutDragging")?.addEventListener("click", () => {
    completeSlider();
  });

  // -------------------- Email step --------------------

  emailForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = normalizeEmail(emailInput?.value || "");

    if (!email) {
      showMessage(emailMessage, "Enter your email address.");
      emailInput?.focus();
      return;
    }

    if (!isValidEmail(email)) {
      showMessage(emailMessage, "Enter a valid email address.");
      emailInput?.focus();
      return;
    }

    currentEmail = email;

    if (selectedEmail) {
      selectedEmail.textContent = currentEmail;
    }

    if (passwordTitle) {
      passwordTitle.textContent = "Welcome";
    }

    if (loginPassword) {
      loginPassword.value = "";
      loginPassword.type = "password";
      loginPassword.autocomplete = "current-password";
    }

    const showPasswordCheckbox = $("showPassword");
    if (showPasswordCheckbox) {
      showPasswordCheckbox.checked = false;
    }

    showPage("passwordPage");
  });

  // -------------------- Change account --------------------

  $("changeEmail")?.addEventListener("click", () => {
    if (emailInput) {
      emailInput.value = currentEmail;
    }

    showPage("emailPage");
  });

  // -------------------- Login --------------------

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = loginPassword?.value || "";

    if (!currentEmail || !isValidEmail(currentEmail)) {
      showMessage(loginMessage, "Enter your email address again.");
      showPage("emailPage");
      return;
    }

    if (!password) {
      showMessage(loginMessage, "Enter your password.");
      loginPassword?.focus();
      return;
    }

    if (password.length < 8) {
      showMessage(
        loginMessage,
        "Your password must be at least 8 characters long."
      );
      loginPassword?.focus();
      return;
    }

    const submitButton = loginForm.querySelector(
      'button[type="submit"]'
    );

    setButtonLoading(submitButton, true);

    try {
      const result = await postJSON("/api/login", {
        email: currentEmail,
        password,
      });

      // Show the confirmation page only after a successful response.
pages.forEach((id) => {
  const page = $(id);
  if (page) {
    page.classList.toggle("hidden", id !== "thankYouPage");
  }
});

const thankYouPage = $("thankYouPage");

if (thankYouPage) {
  thankYouPage.classList.remove("page-enter");
  void thankYouPage.offsetWidth;
  thankYouPage.classList.add("page-enter");
}

// Clear the password from the form.
if (loginPassword) {
  loginPassword.value = "";
}

      // Never store a password in browser storage.
      // Secure session handling should be implemented by the backend.
    } catch (error) {
      showMessage(
        loginMessage,
        error.message || "Login failed. Please try again."
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  });

  // -------------------- Show / hide password --------------------

  $("showPassword")?.addEventListener("change", (event) => {
    if (loginPassword) {
      loginPassword.type = event.target.checked ? "text" : "password";
    }
  });

  // -------------------- Forgot email / password --------------------

  $("forgotEmail")?.addEventListener("click", () => {
    showMessage(
      emailMessage,
     
    );
  });

  $("forgotPassword")?.addEventListener("click", () => {
    showMessage(
      loginMessage,
      
    );
  });

  // -------------------- Cookie banner --------------------

  const cookieBanner = $("cookieBanner");

  try {
    const consent = localStorage.getItem("workhub-cookie-consent");

    if (cookieBanner && !consent) {
      cookieBanner.classList.remove("hidden");
    }
  } catch {
    // Continue if browser storage is unavailable.
  }

  function setCookieConsent(value) {
    try {
      localStorage.setItem("workhub-cookie-consent", value);
    } catch {
      // Dismiss the banner for this page view anyway.
    }

    cookieBanner?.classList.add("hidden");
  }

  $("cookieAccept")?.addEventListener("click", () => {
    setCookieConsent("accepted");
  });

  $("cookieReject")?.addEventListener("click", () => {
    setCookieConsent("essential-only");
  });

  $("cookiePolicy")?.addEventListener("click", () => {
    alert(
      
    );
  });

  // -------------------- Footer links --------------------

  $("helpLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    alert("");
  });

  $("privacyLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    alert("");
  });

  $("termsLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    alert("");
  });

  $("cookiesLink")?.addEventListener("click", (event) => {
    event.preventDefault();
    cookieBanner?.classList.remove("hidden");
  });

  // -------------------- Start app --------------------

  resetSlider();
  showPage("welcomePage");
  
  
});
