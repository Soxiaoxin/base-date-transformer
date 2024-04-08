import './App.css';
import { bitable, FieldType, IFieldMeta, ITableMeta } from "@lark-base-open/js-sdk";
import { Button, Form } from '@douyinfe/semi-ui';
import { BaseFormApi } from '@douyinfe/semi-foundation/lib/es/form/interface';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DateFormats } from './const';
import { addOrdinalSuffix, asyncForEach, getWeekday, numberToChinese } from './utils';

export default function App() {
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
  const [fields, setFields] = useState<IFieldMeta[]>();
  const [textFields, setTextFields] = useState<IFieldMeta[]>();
  const formApi = useRef<BaseFormApi>();

  const transformDate = useCallback((date: Date, format: number) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dd = date.getDate();
    switch(format) {
      case 0:
        return `${year} 年 ${month} 月 ${dd} 日`;
      case 1:
        const option1: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        };
        const formatter1 = new Intl.DateTimeFormat('zh-CN', option1);
        const formattedDate1 = formatter1.format(date);
        const weekday = getWeekday(date, 'zh-CN');
        return `${formattedDate1}，${weekday}`;
      case 2:
        const options: Intl.DateTimeFormatOptions = {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        };
        return new Intl.DateTimeFormat('en-US', options).format(date);
      case 3:
        const option2: Intl.DateTimeFormatOptions = {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        };
        return new Intl.DateTimeFormat('en-US', option2).format(date);
      case 4:
        const option3: Intl.DateTimeFormatOptions = {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        };
        const formatter = new Intl.DateTimeFormat('en-US', option3);
        const formattedDate = formatter.format(date);
        // 添加序数后缀
        const dayWithSuffix = addOrdinalSuffix(date.getDate());
        return formattedDate.replace(/\d+/, dayWithSuffix);
      case 5:
        const option4: Intl.DateTimeFormatOptions = {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        };
        const formatter4 = new Intl.DateTimeFormat('en-US', option4);
        const formattedDate4 = formatter4.format(date);
        return `${formattedDate4} (${getWeekday(date, 'en-US')})`;
      case 6:
        const options6: Intl.DateTimeFormatOptions = { 
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          calendar: 'chinese',
          timeZone: 'Asia/Shanghai'
        };
      
        const formatter6 = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', options6);
        const parts = formatter6.formatToParts(date);
      
        const lunarYear = parseInt(parts[0].value);
        const lunarMonth = parts[2].value;
        const lunarDay = parseInt(parts[3].value);
      
        return `${lunarYear}年${lunarMonth}${numberToChinese(lunarDay)}日(农历)`;
    }
  }, []);

  const addRecord = useCallback(async (params: { table: string, dateField: string; targetField: string, format: number }) => {
    const { table: tableId, dateField, format, targetField } = params;
    if (tableId) {
      const table = await bitable.base.getTableById(tableId);
      const { records } = await table.getRecords({
        pageSize: 5000,
      });
      await asyncForEach(records, async (record) => {
        if (!record.fields[dateField]) {
          // 这一行没有date值
          return;
        }
        const date = new Date(record.fields[dateField]);
        const formattedText = transformDate(date, format);
        record.fields[targetField] = [{
          type: 'text',
          text: formattedText,
        }];
      });
      table.setRecords(records);
    }
  }, []);

  const refreshFieldList = useCallback(async (tableId: string) => {
    const table = await bitable.base.getTableById(tableId);
    if (table) {
      const fieldList = await table.getFieldMetaList();
      const textFields = fieldList.filter(f => f.type === FieldType.Text);
      setTextFields(textFields);
      const dateTimeFields = fieldList.filter(f => f.type === FieldType.DateTime);
      setFields(dateTimeFields);
    }
  }, []);

  useEffect(() => {
    Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()])
      .then(([metaList, selection]) => {
        setTableMetaList(metaList);
        formApi.current?.setValues({ table: selection.tableId });
        refreshFieldList(selection.tableId || '');
      });
  }, []);

  const { t } = useTranslation();

  return (
    <main className="main">
      <Form labelPosition='top' onSubmit={addRecord} getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
        <Form.Select
          field='table'
          label={{ text: t('select_table'), required: true }}
          rules={[
            { required: true, message: t('select_table_placeholder') },
          ]}
          trigger='blur'
          placeholder={t('select_table_placeholder')}
          style={{ width: '100%' }}
          onChange={(tableId) => { refreshFieldList(String(tableId)) }}  >
          {
            Array.isArray(tableMetaList) && tableMetaList.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Form.Select
          label={{ text: t('select_origin_field'), required: true }}
          rules={[
            { required: true, message: t('select_origin_field_placeholder') },
          ]}
          trigger='blur'
          field='dateField'
          placeholder={t("select_origin_field_placeholder")}
          style={{ width: '100%' }}
        >
          {
            Array.isArray(fields) && fields.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Form.Select
          label={{ text: t('select_target_time_format'), required: true }}
          rules={[
            { required: true, message: t('select_target_time_format') },
          ]}
          trigger='blur'
          field='format'
          placeholder={t("select_target_time_format_placeholder")}
          style={{ width: '100%' }}
        >
          {
            DateFormats.map((name, index) => {
              return (
                <Form.Select.Option key={index} value={index}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Form.Select
          label={{ text: t('select_target_fields'), required: true }}
          rules={[
            { required: true, message: t('select_target_fields') },
          ]}
          trigger='blur'
          field='targetField'
          placeholder={t("select_target_fields_placeholder")}
          style={{ width: '100%' }}
        >
          {
            Array.isArray(textFields) && textFields.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Button theme='solid' htmlType='submit'>{t('submit_button')}</Button>
      </Form>
    </main>
  )
}