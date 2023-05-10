import SectionOne from './SectionOne'
import SectionTwo from './SectionTwo'
import SectionThree from './SectionThree'
import img from '../img/Arrow 1.png'

const Section = () => {
  return (
    <>
      <SectionOne/>
      <SectionTwo/>
      <SectionThree/>
      <div className='flex justify-end px-5 md:text-5xl nun'>
        Meet the whole team <img src={img} alt="" className=' h-3 w-3 mt-[8px] md:h-auto md:w-auto '/>
      </div>
    </>
  )
};

export default Section;