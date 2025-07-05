const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const deadlineInput = document.getElementById('todo-deadline');
const repeatCheckbox = document.getElementById('todo-repeat');
const repeatDaysDiv = document.getElementById('repeat-days');
const repeatDayCheckboxes = document.querySelectorAll('#repeat-days input[type="checkbox"]');
const list = document.getElementById('todo-list');
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close');
const modalTitle = document.getElementById('modal-title');
const mainGoalText = document.getElementById('main-goal-text');
const mainGoalDeadline = document.getElementById('main-goal-deadline');
const subGoalForm = document.getElementById('sub-goal-form');
const subGoalInput = document.getElementById('sub-goal-input');
const subGoalDeadline = document.getElementById('sub-goal-deadline');
const subGoalRepeatCheckbox = document.getElementById('sub-goal-repeat');
const subGoalRepeatDaysDiv = document.getElementById('sub-goal-repeat-days');
const subGoalRepeatDayCheckboxes = document.querySelectorAll('#sub-goal-repeat-days input[type="checkbox"]');
const subGoalList = document.getElementById('sub-goal-list');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');
const deadlineAlert = document.getElementById('deadline-alert');
const deadlineContent = document.getElementById('deadline-content');
const editModal = document.getElementById('edit-modal');
const editModalTitle = document.getElementById('edit-modal-title');
const editForm = document.getElementById('edit-form');
const editText = document.getElementById('edit-text');
const editDeadline = document.getElementById('edit-deadline');
const editRepeatCheckbox = document.getElementById('edit-repeat');
const editRepeatDaysDiv = document.getElementById('edit-repeat-days');
const editRepeatDayCheckboxes = document.querySelectorAll('#edit-repeat-days input[type="checkbox"]');
const deleteModal = document.getElementById('delete-modal');
const deleteMessage = document.getElementById('delete-message');

let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentTodoIndex = -1;
let editingType = ''; // 'main' or 'sub'
let editingSubIndex = -1;
let deletingType = ''; // 'main' or 'sub'
let deletingIndex = -1;

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function formatDate(dateString) {
  if (!dateString) return '미설정';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function calculateProgress(todo) {
  if (!todo.subGoals || todo.subGoals.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  
  // 완료된 소목표만 카운트
  const completed = todo.subGoals.filter(subGoal => subGoal.done).length;
  const total = todo.subGoals.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
}

function isOverdue(dateString) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateString);
  deadline.setHours(0, 0, 0, 0);
  return deadline < today;
}

function isToday(dateString) {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateString);
  deadline.setHours(0, 0, 0, 0);
  return deadline.getTime() === today.getTime();
}

function checkDeadlines() {
  const overdueItems = [];
  const todayItems = [];
  
  // 대목표 체크
  todos.forEach((todo, todoIndex) => {
    // 완료된 대목표는 제외
    if (todo.done) return;
    
    if (todo.deadline) {
      if (isOverdue(todo.deadline)) {
        overdueItems.push({
          type: '대목표',
          text: todo.text,
          deadline: todo.deadline,
          index: todoIndex
        });
      } else if (isToday(todo.deadline)) {
        todayItems.push({
          type: '대목표',
          text: todo.text,
          deadline: todo.deadline,
          index: todoIndex
        });
      }
    }
    
    // 반복 목표의 경우 선택된 요일이 오늘인지 확인
    if (todo.isRepeating && todo.repeatDays && todo.repeatDays.length > 0) {
      const today = new Date();
      const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayDayName = dayMap[today.getDay()];
      
      if (todo.repeatDays.includes(todayDayName)) {
        // 오늘이 선택된 요일이면 마감일 알림에 추가
        const deadlineText = todo.deadline ? formatDate(todo.deadline) : '오늘';
        todayItems.push({
          type: '반복 대목표',
          text: todo.text,
          deadline: deadlineText,
          index: todoIndex,
          isRepeating: true
        });
      }
    }
    
    // 소목표 체크
    if (todo.subGoals) {
      todo.subGoals.forEach((subGoal, subIndex) => {
        // 완료된 소목표는 제외
        if (subGoal.done) return;
        
        if (subGoal.deadline) {
          if (isOverdue(subGoal.deadline)) {
            overdueItems.push({
              type: '소목표',
              text: `${todo.text} - ${subGoal.text}`,
              deadline: subGoal.deadline,
              todoIndex: todoIndex,
              subIndex: subIndex
            });
          } else if (isToday(subGoal.deadline)) {
            todayItems.push({
              type: '소목표',
              text: `${todo.text} - ${subGoal.text}`,
              deadline: subGoal.deadline,
              todoIndex: todoIndex,
              subIndex: subIndex
            });
          }
        }
        
        // 반복 소목표의 경우 선택된 요일이 오늘인지 확인
        if (subGoal.isRepeating && subGoal.repeatDays && subGoal.repeatDays.length > 0) {
          const today = new Date();
          const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const todayDayName = dayMap[today.getDay()];
          
          if (subGoal.repeatDays.includes(todayDayName)) {
            // 오늘이 선택된 요일이면 마감일 알림에 추가
            const deadlineText = subGoal.deadline ? formatDate(subGoal.deadline) : '오늘';
            todayItems.push({
              type: '반복 소목표',
              text: `${todo.text} - ${subGoal.text}`,
              deadline: deadlineText,
              todoIndex: todoIndex,
              subIndex: subIndex,
              isRepeating: true
            });
          }
        }
      });
    }
  });
  
  return { overdueItems, todayItems };
}

function renderDeadlineAlert() {
  const { overdueItems, todayItems } = checkDeadlines();
  
  if (overdueItems.length === 0 && todayItems.length === 0) {
    deadlineAlert.style.display = 'none';
    return;
  }
  
  deadlineAlert.style.display = 'block';
  let content = '';
  
  // 지난 마감일
  if (overdueItems.length > 0) {
    content += '<div style="margin-bottom: 15px;"><strong style="color: #dc3545;">지난 마감일</strong></div>';
    overdueItems.forEach(item => {
      content += `
        <div class="deadline-item">
          <div class="goal-type">${item.type}</div>
          <div class="goal-text">${item.text}</div>
          <div class="deadline-date">마감일: ${formatDate(item.deadline)}</div>
        </div>
      `;
    });
  }
  
  // 오늘 마감일
  if (todayItems.length > 0) {
    if (overdueItems.length > 0) {
      content += '<div style="margin: 15px 0;"><strong style="color: #ffc107;">오늘 마감일</strong></div>';
    } else {
      content += '<div style="margin-bottom: 15px;"><strong style="color: #ffc107;">오늘 마감일</strong></div>';
    }
    todayItems.forEach(item => {
      const isRepeating = item.isRepeating || item.type === '반복 대목표';
      const typeClass = isRepeating ? 'repeating' : '';
      const dateClass = isRepeating ? 'repeating' : '';
      
      content += `
        <div class="deadline-item">
          <div class="goal-type ${typeClass}">${item.type}</div>
          <div class="goal-text">${item.text}</div>
          <div class="deadline-date ${dateClass}">마감일: ${item.deadline}</div>
        </div>
      `;
    });
  }
  
  deadlineContent.innerHTML = content;
}

function renderTodos() {
  list.innerHTML = '';
  todos.forEach((todo, index) => {
    const progress = calculateProgress(todo);
    const li = document.createElement('li');
    li.className = todo.done ? 'done' : '';
    li.innerHTML = `
      <div class="todo-content">
        <span class="todo-text">${todo.text}</span>
        ${todo.deadline ? `<div class="todo-deadline">${formatDate(todo.deadline)}</div>` : ''}
        ${todo.isRepeating ? `<div class="todo-repeat-info">${getRepeatText(todo.repeatDays)}</div>` : ''}
        ${todo.done && todo.completedDate ? `<div class="completed-date">완료일: ${formatDate(todo.completedDate)}</div>` : ''}
      </div>
      <div class="todo-actions">
        <span class="progress-count">${progress.percentage}%</span>
        <button class="edit-main-btn" onclick="editMainGoal(${index})">편집</button>
        <button class="delete-main-btn" onclick="deleteMainGoal(${index})">삭제</button>
      </div>
    `;
    
    // 클릭 이벤트 추가 (버튼 클릭 시 모달이 열리지 않도록)
    li.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-main-btn') && !e.target.classList.contains('edit-main-btn')) {
        openModal(index);
      }
    });
    
    list.appendChild(li);
  });
  
  // 마감일 알림 업데이트
  renderDeadlineAlert();
}

function openModal(index) {
  currentTodoIndex = index;
  const todo = todos[index];
  
  modalTitle.textContent = todo.text;
  mainGoalText.textContent = todo.text;
  mainGoalDeadline.textContent = formatDate(todo.deadline);
  
  // 소목표 초기화
  if (!todo.subGoals) {
    todo.subGoals = [];
  }
  
  renderSubGoals();
  updateProgress();
  modal.style.display = 'block';
}

function closeModal() {
  modal.style.display = 'none';
  currentTodoIndex = -1;
}

function updateProgress() {
  if (currentTodoIndex === -1) return;
  
  const todo = todos[currentTodoIndex];
  const progress = calculateProgress(todo);
  
  progressText.textContent = `진행률: ${progress.completed}/${progress.total} (${progress.percentage}%)`;
  progressFill.style.width = `${progress.percentage}%`;
}

function renderSubGoals() {
  if (currentTodoIndex === -1) return;
  
  const todo = todos[currentTodoIndex];
  subGoalList.innerHTML = '';
  
  if (todo.subGoals && todo.subGoals.length > 0) {
    todo.subGoals.forEach((subGoal, index) => {
      const li = document.createElement('li');
      li.className = subGoal.done ? 'done' : '';
      li.innerHTML = `
        <div class="sub-goal-content">
          <span class="todo-text">${subGoal.text}</span>
          ${subGoal.deadline ? `<div class="sub-goal-deadline">${formatDate(subGoal.deadline)}</div>` : ''}
          ${subGoal.isRepeating ? `<div class="todo-repeat-info">${getRepeatText(subGoal.repeatDays)}</div>` : ''}
          ${subGoal.done && subGoal.completedDate ? `<div class="completed-date">완료일: ${formatDate(subGoal.completedDate)}</div>` : ''}
        </div>
        <div>
          <button class="edit-btn" onclick="editSubGoal(${index})">편집</button>
          <button class="toggle-btn" onclick="toggleSubGoal(${index})">
            ${subGoal.done ? '완료취소' : '완료'}
          </button>
          <button class="delete-btn" onclick="deleteSubGoal(${index})">삭제</button>
        </div>
      `;
      subGoalList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = '<span class="todo-text">소목표가 없습니다.</span>';
    li.style.textAlign = 'center';
    li.style.color = '#888';
    subGoalList.appendChild(li);
  }
}

function addTodo(text) {
  const deadline = deadlineInput.value || null;
  const isRepeating = repeatCheckbox.checked;
  const repeatDays = isRepeating ? 
    Array.from(repeatDayCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value) : [];
  
  todos.push({ 
    text, 
    done: false, 
    subGoals: [], 
    deadline,
    isRepeating,
    repeatDays
  });
  
  saveTodos();
  renderTodos();
  
  // 입력 필드 초기화
  deadlineInput.value = '';
  repeatCheckbox.checked = false;
  repeatDaysDiv.style.display = 'none';
  repeatDayCheckboxes.forEach(checkbox => checkbox.checked = false);
}

function addSubGoal(text) {
  if (currentTodoIndex === -1) return;
  
  const deadline = subGoalDeadline.value || null;
  const isRepeating = subGoalRepeatCheckbox.checked;
  const repeatDays = isRepeating ? 
    Array.from(subGoalRepeatDayCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value) : [];
  
  todos[currentTodoIndex].subGoals.push({ 
    text, 
    done: false, 
    deadline,
    isRepeating,
    repeatDays
  });
  
  saveTodos();
  renderSubGoals();
  updateProgress();
  
  // 소목표 추가 시 대목표 완료 상태 다시 체크
  checkMainGoalCompletion();
  
  renderTodos(); // 메인 목록의 진행률 업데이트
  
  // 입력 필드 초기화
  subGoalDeadline.value = '';
  subGoalRepeatCheckbox.checked = false;
  subGoalRepeatDaysDiv.style.display = 'none';
  subGoalRepeatDayCheckboxes.forEach(checkbox => checkbox.checked = false);
}

function toggleSubGoal(index) {
  if (currentTodoIndex === -1) return;
  
  const subGoal = todos[currentTodoIndex].subGoals[index];
  subGoal.done = !subGoal.done;
  
  if (subGoal.done) {
    // 완료 시 완료 날짜 저장
    subGoal.completedDate = new Date().toISOString().split('T')[0];
    
    // 반복 소목표인 경우 새로운 소목표 생성
    if (subGoal.isRepeating && subGoal.repeatDays.length > 0) {
      setTimeout(() => {
        createNextRepeatingSubGoal(index);
        saveTodos();
        renderSubGoals();
        updateProgress();
        renderTodos();
      }, 1000); // 1초 후 새 목표 생성
    }
  } else {
    // 완료 취소 시 완료 날짜 삭제
    delete subGoal.completedDate;
  }
  
  // 대목표 자동 완료 체크 (새로운 소목표 생성 전에 체크)
  checkMainGoalCompletion();
  
  saveTodos();
  renderSubGoals();
  updateProgress();
  renderTodos(); // 메인 목록의 진행률 업데이트
}

function createNextRepeatingSubGoal(completedIndex) {
  if (currentTodoIndex === -1) return;
  
  const completedSubGoal = todos[currentTodoIndex].subGoals[completedIndex];
  
  // 새로운 소목표 생성
  const newSubGoal = {
    text: completedSubGoal.text,
    done: false,
    deadline: completedSubGoal.deadline ? calculateNextDeadline(completedSubGoal.deadline, completedSubGoal.repeatDays) : null,
    isRepeating: completedSubGoal.isRepeating,
    repeatDays: [...completedSubGoal.repeatDays]
  };
  
  // 새로운 소목표를 목록에 추가
  todos[currentTodoIndex].subGoals.push(newSubGoal);
}

function checkMainGoalCompletion() {
  if (currentTodoIndex === -1) return;
  
  const todo = todos[currentTodoIndex];
  const progress = calculateProgress(todo);
  
  // 모든 소목표가 완료되면 대목표도 완료
  if (progress.completed > 0 && progress.completed === progress.total && !todo.done) {
    todo.done = true;
    todo.completedDate = new Date().toISOString().split('T')[0];
    
    // 반복 대목표인 경우 새로운 대목표 생성
    if (todo.isRepeating && todo.repeatDays.length > 0) {
      setTimeout(() => {
        createNextRepeatingMainGoal();
        saveTodos();
        renderTodos();
      }, 1000); // 1초 후 새 목표 생성
    }
  } 
  // 하나라도 미완료가 되면 대목표도 미완료
  else if (progress.completed < progress.total && todo.done) {
    todo.done = false;
    delete todo.completedDate;
  }
}

function createNextRepeatingMainGoal() {
  const completedTodo = todos[currentTodoIndex];
  
  // 새로운 대목표 생성
  const newTodo = {
    text: completedTodo.text,
    done: false,
    subGoals: [],
    deadline: completedTodo.deadline ? calculateNextDeadline(completedTodo.deadline, completedTodo.repeatDays) : null,
    isRepeating: completedTodo.isRepeating,
    repeatDays: [...completedTodo.repeatDays]
  };
  
  // 새로운 대목표를 목록에 추가
  todos.push(newTodo);
  
  // 현재 모달 인덱스를 새로 생성된 대목표로 변경
  currentTodoIndex = todos.length - 1;
}

function deleteSubGoal(index) {
  if (currentTodoIndex === -1) return;
  
  const subGoal = todos[currentTodoIndex].subGoals[index];
  deletingType = 'sub';
  deletingIndex = index;
  
  deleteMessage.textContent = `정말로 소목표 "${subGoal.text}"를 삭제하시겠습니까?`;
  deleteModal.style.display = 'block';
}

function deleteMainGoal(index) {
  const todo = todos[index];
  deletingType = 'main';
  deletingIndex = index;
  
  deleteMessage.textContent = `정말로 대목표 "${todo.text}"를 삭제하시겠습니까? 모든 소목표도 함께 삭제됩니다.`;
  deleteModal.style.display = 'block';
}

function closeDeleteModal() {
  deleteModal.style.display = 'none';
  deletingType = '';
  deletingIndex = -1;
}

function confirmDelete() {
  if (deletingType === 'main') {
    todos.splice(deletingIndex, 1);
    saveTodos();
    renderTodos();
    
    // 현재 열려있는 모달이 삭제된 항목이면 모달 닫기
    if (currentTodoIndex === deletingIndex) {
      closeModal();
    } else if (currentTodoIndex > deletingIndex) {
      // 삭제된 항목보다 뒤에 있던 항목의 인덱스 조정
      currentTodoIndex--;
    }
  } else if (deletingType === 'sub') {
    todos[currentTodoIndex].subGoals.splice(deletingIndex, 1);
    saveTodos();
    renderSubGoals();
    updateProgress();
    
    // 소목표 삭제 시 대목표 완료 상태 다시 체크
    checkMainGoalCompletion();
    
    renderTodos();
  }
  
  closeDeleteModal();
}

function editMainGoal(index) {
  const todo = todos[index];
  editingType = 'main';
  currentTodoIndex = index;
  
  editModalTitle.textContent = '대목표 편집';
  editText.value = todo.text;
  editDeadline.value = todo.deadline || '';
  editRepeatCheckbox.checked = todo.isRepeating || false;
  editRepeatDaysDiv.style.display = todo.isRepeating ? 'block' : 'none';
  
  editRepeatDayCheckboxes.forEach(checkbox => {
    checkbox.checked = todo.repeatDays.includes(checkbox.value);
  });
  
  editModal.style.display = 'block';
}

function editSubGoal(index) {
  if (currentTodoIndex === -1) return;
  
  const subGoal = todos[currentTodoIndex].subGoals[index];
  editingType = 'sub';
  editingSubIndex = index;
  
  editModalTitle.textContent = '소목표 편집';
  editText.value = subGoal.text;
  editDeadline.value = subGoal.deadline || '';
  
  editModal.style.display = 'block';
}

function closeEditModal() {
  editModal.style.display = 'none';
  editingType = '';
  editingSubIndex = -1;
}

function saveEdit() {
  const newText = editText.value.trim();
  const newDeadline = editDeadline.value || null;
  const newIsRepeating = editRepeatCheckbox.checked;
  const newRepeatDays = newIsRepeating ? 
    Array.from(editRepeatDayCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.value) : [];
  
  if (newText === '') return;
  
  if (editingType === 'main') {
    const todo = todos[currentTodoIndex];
    todo.text = newText;
    todo.deadline = newDeadline;
    todo.isRepeating = newIsRepeating;
    todo.repeatDays = newRepeatDays;
    
    saveTodos();
    renderTodos();
    
    // 현재 열려있는 모달이 편집된 항목이면 모달 내용 업데이트
    if (modal.style.display === 'block') {
      modalTitle.textContent = todo.text;
      mainGoalText.textContent = todo.text;
      mainGoalDeadline.textContent = formatDate(todo.deadline);
    }
  } else if (editingType === 'sub') {
    const subGoal = todos[currentTodoIndex].subGoals[editingSubIndex];
    subGoal.text = newText;
    subGoal.deadline = newDeadline;
    
    saveTodos();
    renderSubGoals();
    updateProgress();
    
    // 소목표 편집 시 대목표 완료 상태 다시 체크
    checkMainGoalCompletion();
    
    renderTodos();
  }
  
  closeEditModal();
}

// 이벤트 리스너
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value.trim() !== '') {
    addTodo(input.value.trim());
    input.value = '';
  }
});

// 반복 체크박스 이벤트 리스너
repeatCheckbox.addEventListener('change', () => {
  repeatDaysDiv.style.display = repeatCheckbox.checked ? 'block' : 'none';
});

editRepeatCheckbox.addEventListener('change', () => {
  editRepeatDaysDiv.style.display = editRepeatCheckbox.checked ? 'block' : 'none';
});

subGoalRepeatCheckbox.addEventListener('change', () => {
  subGoalRepeatDaysDiv.style.display = subGoalRepeatCheckbox.checked ? 'block' : 'none';
});

subGoalForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (subGoalInput.value.trim() !== '') {
    addSubGoal(subGoalInput.value.trim());
    subGoalInput.value = '';
  }
});

closeBtn.addEventListener('click', closeModal);

// 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.style.display === 'block') {
    closeModal();
  }
});

// 편집 폼 이벤트 리스너
editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveEdit();
});

// 편집 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

// 편집 모달 ESC 키로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && editModal.style.display === 'block') {
    closeEditModal();
  }
});

// 삭제 모달 외부 클릭 시 닫기
window.addEventListener('click', (e) => {
  if (e.target === deleteModal) {
    closeDeleteModal();
  }
});

// 삭제 모달 ESC 키로 닫기
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && deleteModal.style.display === 'block') {
    closeDeleteModal();
  }
});

renderTodos();

// 현재 날짜 확인
console.log(new Date().toISOString().split('T')[0]);

// 마감일 확인
console.log(todos);

function getRepeatText(repeatDays) {
  if (!repeatDays || repeatDays.length === 0) return '';
  
  const dayNames = {
    'monday': '월',
    'tuesday': '화',
    'wednesday': '수',
    'thursday': '목',
    'friday': '금',
    'saturday': '토',
    'sunday': '일'
  };
  
  const selectedDays = repeatDays.map(day => dayNames[day]).join(', ');
  return `${selectedDays}요일마다`;
}

function calculateNextDeadline(deadline, repeatDays) {
  if (!deadline || !repeatDays || repeatDays.length === 0) return null;
  
  const currentDate = new Date(deadline);
  const currentDay = currentDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  
  // 현재 요일을 repeatDays 형식으로 변환
  const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = dayMap[currentDay];
  
  // 현재 요일이 선택된 요일에 포함되어 있는지 확인
  if (repeatDays.includes(currentDayName)) {
    // 현재 요일이 선택된 요일이면, 다음 선택된 요일로 이동
    const currentIndex = repeatDays.indexOf(currentDayName);
    const nextIndex = (currentIndex + 1) % repeatDays.length;
    const nextDayName = repeatDays[nextIndex];
    const nextDayIndex = dayMap.indexOf(nextDayName);
    
    const nextDate = new Date(currentDate);
    const daysToAdd = (nextDayIndex - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7; // 같은 요일이면 7일 후
    nextDate.setDate(currentDate.getDate() + daysToAdd);
    
    return nextDate.toISOString().split('T')[0];
  } else {
    // 현재 요일이 선택되지 않았으면, 가장 가까운 다음 선택된 요일로 이동
    let minDays = 7;
    let nextDayName = repeatDays[0];
    
    repeatDays.forEach(dayName => {
      const dayIndex = dayMap.indexOf(dayName);
      let daysDiff = (dayIndex - currentDay + 7) % 7;
      if (daysDiff === 0) daysDiff = 7;
      
      if (daysDiff < minDays) {
        minDays = daysDiff;
        nextDayName = dayName;
      }
    });
    
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + minDays);
    
    return nextDate.toISOString().split('T')[0];
  }
}
