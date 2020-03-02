/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React, { useState, memo } from 'react';
import FeedbackModal from './FeedbackModal';

function Footer() {
  const [modalOpen, setModalOpen] = useState(false);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };
  return (
    <>
      <div className='footer'>

        <div className='footer ui basic center aligned segment'>
          See an issue or want to add to this website? Fork it or create an issue on
          <a target='_blank' rel='noopener noreferrer' href='https://github.com/sandboxnu/searchneu'>
            &nbsp;GitHub
          </a>
          .
        </div>

        <div className='ui divider' />

        <div className='footer ui basic center aligned segment credits'>
          A&nbsp;
          <a target='_blank' rel='noopener noreferrer' href='https://www.sandboxneu.com'>
            Sandbox
          </a>
          &nbsp;Project (founded by&nbsp;
          <a target='_blank' rel='noopener noreferrer' href='http://github.com/ryanhugh'>
            Ryan Hughes
          </a>
          , with some awesome&nbsp;
          <a target='_blank' rel='noopener noreferrer' href='https://github.com/sandboxnu/searchneu/graphs/contributors'>
            contributors
          </a>
          )
        </div>
        <div className='footer ui basic center aligned segment affiliation'>
          Search NEU is built for students by students & is not affiliated with NEU.
        </div>
        <div className='footer ui basic center aligned segment contact'>
          <a role='button' tabIndex={ 0 } onClick={ toggleModal }>
            Feedback
          </a>
          &nbsp;•&nbsp;
          <a role='button' tabIndex={ 0 } onClick={ toggleModal }>
            Report a bug
          </a>
          &nbsp;•&nbsp;
          <a role='button' tabIndex={ 0 } onClick={ toggleModal }>
            Contact
          </a>
        </div>

      </div>
      <FeedbackModal isFeedback toggleForm={ toggleModal } feedbackModalOpen={ modalOpen } />
    </>
  );
}
export default memo(Footer);
