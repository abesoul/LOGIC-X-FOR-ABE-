export function saveProject(data) {
  localStorage.setItem("neondaw-project", JSON.stringify(data));
  alert("Project saved!");
}

export function loadProject() {
  const data = JSON.parse(localStorage.getItem("neondaw-project"));
  alert("Project loaded!");
  return data;
}
