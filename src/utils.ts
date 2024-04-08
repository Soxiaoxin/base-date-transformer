export const asyncForEach = (array: any[], callback: (item: any) => Promise<void>): Promise<void> => {
  let completedCount = 0; // 计数器，用于跟踪已完成的异步任务数量
  
  return new Promise((resolve) => {
    array.forEach(async (item) => {
      await callback(item);
      completedCount++;

      if (completedCount === array.length) {
        resolve();
      }
    });
  });
};

// 添加序数后缀
export function addOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return day + 'th';
  }

  switch (day % 10) {
    case 1:
      return day + 'st';
    case 2:
      return day + 'nd';
    case 3:
      return day + 'rd';
    default:
      return day + 'th';
  }
}

// 获取星期几
export function getWeekday(date: Date, lang: string): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long'
  };

  const formatter = new Intl.DateTimeFormat(lang, options);
  return formatter.format(date);
}

export function numberToChinese(num: number) {
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '三十一'];
  return chineseNumbers[num - 1];
}