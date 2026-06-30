import { useState } from 'react';

export default function useDatePicker(setFinalDate, formatter) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const openPicker = () => {
    setShow(true);
  };

  const onChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShow(false);
      return;
    }

    const currentDate = selectedDate || tempDate;
    setTempDate(currentDate);

    setFinalDate(formatter(currentDate));
    setShow(false);
  };

  return {
    show,
    tempDate,
    openPicker,
    onChange,
  };
}
