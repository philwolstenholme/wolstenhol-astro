let intervalId: ReturnType<typeof setInterval> | undefined;

export const rotateTitle = (text: string, separator = "-", speed = 300, prefix = "") => {
  stopRotatingTitle();

  let title = `${text} ${separator} `;

  intervalId = setInterval(() => {
    const rest = title.replace(prefix, "");
    title = prefix + rest.substring(1) + rest.charAt(0);
    window.requestAnimationFrame(() => {
      document.title = title;
    });
  }, speed);
};

export const stopRotatingTitle = () => {
  clearInterval(intervalId);
  intervalId = undefined;
};
