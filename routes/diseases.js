const express = require('express');
const { Diseases } = require('../models/disease');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

router.get(`/`, async (req, res) =>{
    
    console.log(req.query)
       
    const diseaseList = await Diseases.find();

    if(!diseaseList) {
        res.status(500).json({success: false})
    } 
    res.send(diseaseList);
})

router.get(`/select/:id`, async (req, res) =>{
    const disease = await Diseases.findById(req.params.id);

    if(!disease) {
        res.status(500).json({success: false})
    } 
    res.send(disease);
})

router.post(`/add`, async (req, res) => {
    console.log(req.files);

    const newDisease = new Diseases({
        name: req.body.name,
    });

    try {
        const savedDisease = await newDisease.save();
        res.status(201).send(savedDisease);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
});


router.put('/:id', async (req, res) => {
    console.log(req.body);
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('INVALID DISEASE ID');
    }

    const disease = await Diseases.findById(req.params.id);
    if (!disease) return res.status(400).send('INVALID DISEASE!');

    const updatedDisease= await Diseases.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
        },
        { new: true }
    );

    if (!updatedDisease) return res.status(500).send('THE DISEASE CANNOT BE UPDATED!');

    res.send(updatedDisease);
});

router.delete('/:id', (req, res)=>{
    Diseases.findByIdAndRemove(req.params.id).then(disease =>{
        if(disease) {
            return res.status(200).json({success: true, message: 'THE DISEASE IS DELETED!'})
        } else {
            return res.status(404).json({success: false , message: "DISEASE NOT FOUND!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

module.exports=router;