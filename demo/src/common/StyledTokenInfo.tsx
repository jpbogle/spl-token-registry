import Colors from 'common/colors';
import styled from 'styled-components';

export const StyledTokenInfo = styled.div`
  display: flex;
  color: ${Colors.white};
  margin: 50px 30px;
  border-radius: 40px;
  transition: .2s all;
  position: relative;
  // &:hover {
  //   background: ${Colors.darkBlue};
  //   cursor: pointer;
  //   transform: scale(1.005);
  // }

  .image { 
    img {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      border: ${Colors.border};
      object-fit: cover;
    }
  }

  .title {
    font-size: 18px;
    margin-bottom: 6px;
  }

  .info {
    height: 100%;
    flex-grow: 2;
    padding: 10px 30px;
  }

  .symbol {
    color: ${Colors.lightGray};
    max-width: 90%;
  }

  .address {
    margin-top: 10px;
    color: ${Colors.lightGray};
    max-width: 90%;
  }

  .tags {
    display: flex;
    align-items: center;
    margin-top: 10px;
    font-size: 12px;
    color: ${Colors.lightGray};

    .tag {
      border: ${Colors.border};
      border-radius: 16px;
      padding: 5px 10px;  
      margin: 5px;
      transition: .1s all;
      &:hover {
        background: ${Colors.darkBlue} !important;
        color: ${Colors.lightGray} !important;
        cursor: pointer;
      }
    }
  }

  .expiration {
    position: absolute;
    right: 30px;
    bottom: 50px;
    color: ${Colors.lightGray};
  }

  .buttons {
    display: flex;
    gap: 10px;
  }

  .progress-outer {
    width: 100%;
    height: 20px;
    border: ${Colors.border};
    border-radius: 16px;
    overflow: hidden;
    background: ${Colors.darkBlue};
    &:hover {
      cursor: pointer;
    }

    .progress {
      height: 100%;
      background: ${Colors.green};
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        cursor: pointer;
      }
    }
  }
`;
