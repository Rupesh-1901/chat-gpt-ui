import React, { useEffect, useState } from 'react'
import { AppsProvide, useApps } from './context'
import { classnames } from '@/components/utils'
import { useGlobal } from '../context'
import styles from './apps.module.less'
import { Search, Button } from '@/components'
import { auth } from '../context/firebase'
import { useAuth } from '../context/AuthContext'
import { CreateProfileModal } from '../component/CreateProfileModal'
import { message as antMessage } from 'antd'

export function AppItem(props) {
  const { newChat } = useGlobal();
  console.log(props);
  const handleClick = () => {
    const persona = {
      title: props.title || props.persona_name,
      desc: props.desc || props.persona_bio,
      role: props.role,
      id: props.id
    };
    newChat(persona);
  };

  return (
    <div className={styles.app} onClick={handleClick}>
      {/* <div className={classnames(styles.app_icon, `ico-prompts`)}></div> */}
      <div className={styles.app_content}>
        <div className={styles.app_title}>{props.title || props.persona_name}</div>
        <div className={styles.app_desc}>{props.desc || props.persona_bio}</div>
      </div>
    </div>
  )
}

export function Empty() {
  return (
    <div className={classnames(styles.empty, 'flex-column')}>
      <div className={classnames(styles.icon, 'ico-prompts')} />
      <div className={styles.empty_text}>No personas found</div>
    </div>
  )
}

export function Category(props) {
  const { setState, apps, current, category, userPersonas } = useApps();
  const defaultApps = apps.filter(item => item.id === category[current].id);
  
  // Debug logs
  console.log('Current category:', props.title);
  console.log('User Personas:', userPersonas);
  
  const userApps = userPersonas.filter(item => {
    console.log('Comparing:', {
      'persona_type': item.persona_type,
      'category_title': props.title,
      'matches': item.persona_type?.toLowerCase() === props.title?.toLowerCase()
    });
    return item.persona_type?.toLowerCase() === props.title?.toLowerCase();
  });
  
  console.log('Filtered user apps:', userApps);
  
  const list = [...defaultApps, ...userApps];
  console.log('Combined list:', list);

  return (
    <div>
      <div className={classnames(styles.category, current === props.index && styles.current)} onClick={() => setState({ current: props.index })}>
        <div className={classnames(styles.icon, `ico-${props.icon}`)}></div>
        <div className={styles.category_title}>{props?.title}</div>
      </div>
      <div>
        {props.index === current && (list.length === 0 ? <Empty /> : list.map((item, index) => {
          console.log('Rendering item:', item);
          return <AppItem {...item} key={index} />;
        }))}
      </div>
    </div>
  )
}

export function AppContainer() {
  const { category } = useApps();
  const [createProfileModalVisible, setCreateProfileModalVisible] = useState(false);
  const { currentUser } = useAuth();

  const handleCreatePersona = () => {
    if (!currentUser) {
      // TODO: Show login prompt
      return;
    }
    setCreateProfileModalVisible(true);
  };

  return (
    <div className={styles.apps}>
      {category.map((item, index) => <Category index={index} {...item} key={item.id} />)}
      <div className={styles.create_persona}>
        <Button
          type="primary"
          icon="add"
          block
          onClick={() => {
            const user = auth.currentUser;
            if (!user) {
              antMessage.error('Please login to create a persona');
              return;
            }
            setCreateProfileModalVisible(true);
          }}
        >
          Create Persona
        </Button>
      </div>
      <CreateProfileModal
        visible={createProfileModalVisible}
        onClose={() => setCreateProfileModalVisible(false)}
        isPersonaOnly={true}
      />
    </div>
  );
}

export function Apps() {
  const [userPersonas, setUserPersonas] = useState([]);

  useEffect(() => {
    const fetchUserPersonas = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const response = await fetch(`http://${process.env.VM_IP}:3001/api/personas/${user.uid}/${user.email}`);
          console.log('Response:', response);
          const data = await response.json();
          console.log('Data:', data);
          if (data.success) {
            setUserPersonas(data.personas);
          }
        } catch (error) {
          console.error('Error fetching user personas:', error);
        }
      }
    };

    fetchUserPersonas();
  }, []);

  return (
    <AppsProvide initialUserPersonas={userPersonas}>
      <AppContainer />
    </AppsProvide>
  )
}