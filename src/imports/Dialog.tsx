import svgPaths from "./svg-jmv0eutr1u";

function Icon() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
            <path d={svgPaths.p48af40} id="Vector" stroke="var(--stroke-0, #111827)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
            <path d={svgPaths.p30908200} id="Vector" stroke="var(--stroke-0, #111827)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="opacity-70 relative rounded-[2px] shrink-0 size-[16px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="h-full relative shrink-0 w-[462px]" data-name="Heading 2">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['IBM_Plex_Sans_Arabic:Regular',sans-serif] leading-[18px] left-[315.52px] not-italic text-[#111827] text-[18px] top-0 whitespace-nowrap" dir="auto">
          إضافة ثلاجة جديدة
        </p>
      </div>
    </div>
  );
}

function DialogHeader() {
  return (
    <div className="absolute content-stretch flex h-[18px] items-center left-[24px] top-[24px] w-[462px]" data-name="DialogHeader">
      <Button />
      <Heading />
    </div>
  );
}

function Tab() {
  return (
    <div className="bg-[#155dfc] col-4 h-[29px] justify-self-stretch relative rounded-[12px] row-1 shrink-0" data-name="Tab">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[9px] py-[5px] relative size-full">
          <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" dir="auto">
            الأساسيات
          </p>
        </div>
      </div>
    </div>
  );
}

function Tab1() {
  return (
    <div className="col-3 h-[29px] justify-self-stretch relative rounded-[12px] row-1 shrink-0" data-name="Tab">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[9px] py-[5px] relative size-full">
          <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#111827] text-[14px] text-center whitespace-nowrap" dir="auto">
            الأبعاد والسعة
          </p>
        </div>
      </div>
    </div>
  );
}

function Tab2() {
  return (
    <div className="col-2 h-[29px] justify-self-stretch relative rounded-[12px] row-1 shrink-0" data-name="Tab">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[9px] py-[5px] relative size-full">
          <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#111827] text-[14px] text-center whitespace-nowrap" dir="auto">
            الماكينة والأسعار
          </p>
        </div>
      </div>
    </div>
  );
}

function Tab3() {
  return (
    <div className="col-1 h-[29px] justify-self-stretch relative rounded-[12px] row-1 shrink-0" data-name="Tab">
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[9px] py-[5px] relative size-full">
          <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#111827] text-[14px] text-center whitespace-nowrap" dir="auto">
            ملاحظات
          </p>
        </div>
      </div>
    </div>
  );
}

function TabList() {
  return (
    <div className="bg-[#f3f4f6] h-[36px] relative rounded-[12px] shrink-0 w-[462px]" data-name="Tab List">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid grid grid-cols-[repeat(4,minmax(0,1fr))] grid-rows-[repeat(1,minmax(0,1fr))] px-[3px] py-[3.5px] relative size-full">
        <Tab />
        <Tab1 />
        <Tab2 />
        <Tab3 />
      </div>
    </div>
  );
}

function Label() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-end relative shrink-0 w-full" data-name="Label">
      <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#111827] text-[14px] text-right whitespace-nowrap" dir="auto">
        حرف الثلاجة *
      </p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-[#f9fafb] h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['IBM_Plex_Sans_Arabic:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6b7280] text-[14px] text-right uppercase w-[122px]">A</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] h-[94px] items-start left-0 top-0 w-[146px]" data-name="Container">
      <Label />
      <Input />
    </div>
  );
}

function Label1() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-end relative shrink-0 w-full" data-name="Label">
      <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#111827] text-[14px] text-right whitespace-nowrap" dir="auto">
        اسم الثلاجة *
      </p>
    </div>
  );
}

function Input1() {
  return (
    <div className="bg-[#f9fafb] h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center px-[12px] py-[4px] relative size-full">
          <p className="font-['IBM_Plex_Sans_Arabic:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6b7280] text-[14px] text-right w-[280px]" dir="auto">
            مثال: ثلاجة الفواكه
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[6px]" />
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] items-start left-[158px] top-0 w-[304px]" data-name="Container">
      <Label1 />
      <Input1 />
    </div>
  );
}

function Warehouses() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Warehouses">
      <Container1 />
      <Container2 />
    </div>
  );
}

function Label2() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-end relative shrink-0 w-full" data-name="Label">
      <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#111827] text-[14px] text-right whitespace-nowrap" dir="auto">
        نوع التخزين
      </p>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon" opacity="0.5">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[20px] relative shrink-0 w-[87.188px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#6b7280] text-[14px] text-center whitespace-nowrap" dir="auto">
          اختر نوع التخزين
        </p>
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="bg-white h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[13px] py-px relative size-full">
          <Icon1 />
          <Text />
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] h-[56px] items-start left-0 top-0 w-[225px]" data-name="Container">
      <Label2 />
      <Button1 />
    </div>
  );
}

function Label3() {
  return (
    <div className="content-stretch flex h-[14px] items-center justify-end relative shrink-0 w-full" data-name="Label">
      <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[14px] not-italic relative shrink-0 text-[#111827] text-[14px] text-right whitespace-nowrap" dir="auto">
        حالة التشغيل
      </p>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Icon" opacity="0.5">
          <path d="M4 6L8 10L12 6" id="Vector" stroke="var(--stroke-0, #6B7280)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[20px] relative shrink-0 w-[36.781px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center overflow-clip relative rounded-[inherit] size-full">
        <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#111827] text-[14px] text-center whitespace-nowrap" dir="auto">
          تشغيل
        </p>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="bg-white h-[36px] relative rounded-[6px] shrink-0 w-full" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#d1d5dc] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center justify-between px-[13px] py-px relative size-full">
          <Icon2 />
          <Text1 />
        </div>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[6px] h-[56px] items-start left-[237px] top-0 w-[225px]" data-name="Container">
      <Label3 />
      <Button2 />
    </div>
  );
}

function Warehouses1() {
  return (
    <div className="h-[56px] relative shrink-0 w-full" data-name="Warehouses">
      <Container3 />
      <Container4 />
    </div>
  );
}

function TabPanel() {
  return (
    <div className="h-[136px] relative shrink-0 w-[462px]" data-name="Tab Panel">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[16px] items-start pt-[8px] relative size-full">
        <Warehouses />
        <Warehouses1 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] h-[188px] items-start left-[24.5px] top-[58px] w-[462px]" data-name="Container">
      <TabList />
      <TabPanel />
    </div>
  );
}

function Button3() {
  return (
    <div className="bg-[#f9fafb] h-[36px] relative rounded-[6px] shrink-0 w-[57.75px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#e5e7eb] border-solid inset-0 pointer-events-none rounded-[6px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[17px] py-[9px] relative size-full">
        <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#111827] text-[14px] text-center whitespace-nowrap" dir="auto">
          إلغاء
        </p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="bg-[#155dfc] h-[36px] relative rounded-[6px] shrink-0 w-[97.844px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center px-[16px] py-[8px] relative size-full">
        <p className="font-['IBM_Plex_Sans_Arabic:Medium',sans-serif] leading-[20px] not-italic relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" dir="auto">
          حفظ الثلاجة
        </p>
      </div>
    </div>
  );
}

function DialogFooter() {
  return (
    <div className="absolute content-stretch flex gap-[8px] h-[36px] items-start justify-end left-[24px] pr-[298.406px] top-[308px] w-[462px]" data-name="DialogFooter">
      <Button3 />
      <Button4 />
    </div>
  );
}

export default function Dialog() {
  return (
    <div className="bg-white border border-[#e5e7eb] border-solid overflow-clip relative rounded-[8px] shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] size-full" data-name="Dialog">
      <DialogHeader />
      <Container />
      <DialogFooter />
    </div>
  );
}